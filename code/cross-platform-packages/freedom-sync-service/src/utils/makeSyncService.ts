import type { PR } from 'freedom-async';
import { debugTopic, excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { DeviceNotificationClient } from 'freedom-device-notification-types';
import type { RemoteInfo, SyncPuller, SyncPusher } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { TaskQueue } from 'freedom-task-queue';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import { noop } from 'lodash-es';

import { DEFAULT_MAX_PULL_CONCURRENCY, DEFAULT_MAX_PUSH_CONCURRENCY } from '../consts/concurrency.ts';
import type { InternalSyncService } from '../internal/types/InternalSyncService.ts';
import { attachSyncServiceToSyncableStore } from '../internal/utils/attachSyncServiceToSyncableStore.ts';
import { pullSyncableFromRemotes } from '../internal/utils/pullSyncableFromRemotes.ts';
import { pushSyncableToRemotes } from '../internal/utils/pushSyncableToRemotes.ts';
import type { ShouldSyncWithAllRemotesFunc } from '../types/ShouldSyncWithAllRemotesFunc.ts';
import type { SyncService } from '../types/SyncService.ts';
import type { SyncServiceLogEntry } from '../types/SyncServiceLogEntry.ts';

export const makeSyncService = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      store,
      puller,
      pusher,
      deviceNotificationClients,
      getRemotes,
      shouldSyncWithAllRemotes,
      shouldRecordLogs = false
    }: {
      store: MutableSyncableStore;
      puller: SyncPuller;
      pusher: SyncPusher;
      deviceNotificationClients: () => DeviceNotificationClient[];
      getRemotes: () => RemoteInfo[];
      shouldSyncWithAllRemotes: ShouldSyncWithAllRemotesFunc;
      shouldRecordLogs?: boolean;
    }
  ): PR<SyncService> => {
    const pullQueue = new TaskQueue(trace);
    const pushQueue = new TaskQueue(trace);

    let detachSyncService: () => void = noop;

    const logEntries: SyncServiceLogEntry[] = [];

    const appendLogEntry = (logEntry: SyncServiceLogEntry) => {
      DEV: debugTopic('SYNC', (log) => log('Appending sync log entry', logEntry));
      logEntries.push(logEntry);
    };

    const service: InternalSyncService = {
      // Internal

      puller,
      pusher,

      // External

      getRemotes,

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
          return pushSyncableToRemotes(trace, { store, syncService: service }, args);
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

      // Logging Support

      setShouldRecordLogs: (shouldRecord) => {
        shouldRecordLogs = shouldRecord;

        service.appendLogEntry = shouldRecord ? appendLogEntry : undefined;
      },

      isRecordingLogs: () => shouldRecordLogs,

      appendLogEntry: shouldRecordLogs ? appendLogEntry : undefined,

      getLogEntries: () => {
        return [...logEntries];
      },

      clearLogEntries: () => {
        logEntries.length = 0;
      }
    };

    return makeSuccess(service);
  }
);
