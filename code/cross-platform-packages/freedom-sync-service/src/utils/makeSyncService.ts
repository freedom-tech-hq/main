import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeDevLoggingSupport } from 'freedom-dev-logging-support';
import type { DeviceNotificationClient } from 'freedom-device-notification-types';
import type { RemoteAccessor, RemoteId } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { TaskQueue } from 'freedom-task-queue';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import { noop } from 'lodash-es';

import { DEFAULT_MAX_PULL_CONCURRENCY, DEFAULT_MAX_PUSH_CONCURRENCY } from '../consts/concurrency.ts';
import { attachSyncServiceToSyncableStore } from '../internal/utils/attachSyncServiceToSyncableStore.ts';
import { pullSyncableFromRemotes } from '../internal/utils/pullSyncableFromRemotes.ts';
import { pushSyncableToRemotes } from '../internal/utils/pushSyncableToRemotes.ts';
import type { ShouldSyncWithAllRemotesFunc } from '../types/ShouldSyncWithAllRemotesFunc.ts';
import type { SyncService } from '../types/SyncService.ts';
import type { SyncServiceLogEntry } from '../types/SyncServiceLogEntry.ts';

export interface MakeSyncServiceArgs {
  store: MutableSyncableStore;
  deviceNotificationClients: () => DeviceNotificationClient[];
  getRemotesAccessors: () => Partial<Record<RemoteId, RemoteAccessor>>;
  shouldSyncWithAllRemotes: ShouldSyncWithAllRemotesFunc;
  shouldRecordLogs?: boolean;
}

export const makeSyncService = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, deviceNotificationClients, getRemotesAccessors, shouldSyncWithAllRemotes, shouldRecordLogs = false }: MakeSyncServiceArgs
  ): PR<SyncService> => {
    const pullQueue = new TaskQueue(trace);
    const pushQueue = new TaskQueue(trace);

    let detachSyncService: () => void = noop;

    const service = {
      // External

      getRemotesAccessors,

      shouldSyncWithAllRemotes,

      pullFromRemotes: (args) => {
        const { path, hash } = args;
        const key = path.toString();
        const version = hash;

        pullQueue.add({ key, version }, async (trace) => {
          const pulled = await disableLam(trace, 'not-found', (trace) =>
            pullSyncableFromRemotes(trace, { store, syncService: service }, args)
          );
          if (!pulled.ok) {
            if (pulled.value.errorCode === 'not-found') {
              return makeSuccess(undefined);
            }
            return excludeFailureResult(pulled, 'not-found');
          }

          return makeSuccess(undefined);
        });
      },

      pushToRemotes: (args) => {
        const { path, hash } = args;
        const key = path.toString();
        const version = hash;

        pushQueue.add({ key, version }, async (trace) => {
          return await pushSyncableToRemotes(trace, { store, syncService: service }, args);
        });
      },

      start: makeAsyncResultFunc(
        [import.meta.filename, 'start'],
        async (trace, { maxPullConcurrency = DEFAULT_MAX_PULL_CONCURRENCY, maxPushConcurrency = DEFAULT_MAX_PUSH_CONCURRENCY } = {}) => {
          pullQueue.start({ maxConcurrency: maxPullConcurrency });
          pushQueue.start({ maxConcurrency: maxPushConcurrency });

          detachSyncService();

          const attached = await attachSyncServiceToSyncableStore(trace, service, {
            store,
            deviceNotificationClients: deviceNotificationClients()
          });
          if (!attached.ok) {
            return attached;
          }
          detachSyncService = attached.value.detach;

          return makeSuccess(undefined);
        }
      ),

      stop: makeAsyncResultFunc([import.meta.filename, 'stop'], async (_trace) => {
        pullQueue.stop();
        pushQueue.stop();

        detachSyncService();
        detachSyncService = noop;

        return makeSuccess(undefined);
      }),

      areQueuesEmpty: () => pushQueue.isEmpty() && pullQueue.isEmpty(),

      devLogging: makeDevLoggingSupport<SyncServiceLogEntry>(shouldRecordLogs)
    } satisfies SyncService;

    return makeSuccess(service);
  }
);
