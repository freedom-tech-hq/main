import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { objectKeys } from 'freedom-cast';
import { makeDevLoggingSupport } from 'freedom-dev-logging-support';
import type { RemoteAccessor, RemoteConnection, RemoteId } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { TaskQueue } from 'freedom-task-queue';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import { noop } from 'lodash-es';

import { DEFAULT_MAX_PULL_CONCURRENCY, DEFAULT_MAX_PUSH_CONCURRENCY } from '../consts/concurrency.ts';
import { attachSyncServiceToSyncableStore } from '../internal/utils/attachSyncServiceToSyncableStore.ts';
import { pullSyncableFromRemotes } from '../internal/utils/pullSyncableFromRemotes.ts';
import { pushSyncableToRemotes } from '../internal/utils/pushSyncableToRemotes.ts';
import type { GetSyncStrategyForPathFunc } from '../types/GetSyncStrategyForPathFunc.ts';
import type { ShouldSyncWithAllRemotesFunc } from '../types/ShouldSyncWithAllRemotesFunc.ts';
import type { SyncService } from '../types/SyncService.ts';
import type { SyncServiceLogEntry } from '../types/SyncServiceLogEntry.ts';

export interface MakeSyncServiceArgs {
  store: MutableSyncableStore;
  remoteConnections: RemoteConnection[];
  shouldSyncWithAllRemotes: ShouldSyncWithAllRemotesFunc;
  getSyncStrategyForPath: GetSyncStrategyForPathFunc;
  shouldRecordLogs?: boolean;
}

export const makeSyncService = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, remoteConnections, shouldSyncWithAllRemotes, getSyncStrategyForPath, shouldRecordLogs = false }: MakeSyncServiceArgs
  ): PR<SyncService> => {
    const pullQueue = new TaskQueue(trace);
    const pushQueue = disableLam(trace, 'not-found', (trace) => new TaskQueue(trace));

    let detachSyncService: () => void = noop;

    const remoteAccessors = remoteConnections.reduce((out: Partial<Record<RemoteId, RemoteAccessor>>, connection) => {
      out[connection.accessor.remoteId] = connection.accessor;
      return out;
    }, {});
    const remoteChangeNotificationClients = remoteConnections.map((connection) => connection.changeNotificationClient);

    // If there's exactly one remote, we should always default to that one (which will simplify the queue deduping)
    const remoteIds = objectKeys(remoteAccessors);
    const defaultRemoteId: RemoteId | undefined = remoteIds.length === 1 ? remoteIds[0] : undefined;

    const service = {
      // External

      remoteAccessors,

      shouldSyncWithAllRemotes,

      getSyncStrategyForPath,

      pullFromRemotes: ({ remoteId = defaultRemoteId, path, hash }) => {
        const key = path.toString();
        const version = JSON.stringify({ remoteId, hash });

        pullQueue.add({ key, version }, async (trace) => {
          const pulled = await disableLam(trace, 'not-found', (trace) =>
            pullSyncableFromRemotes(trace, { store, syncService: service }, { remoteId, path })
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

      pushToRemotes: ({ remoteId = defaultRemoteId, path, hash }) => {
        const key = path.toString();
        const version = JSON.stringify({ remoteId, hash });

        pushQueue.add({ key, version }, async (trace) => {
          const pushed = await pushSyncableToRemotes(trace, { store, syncService: service }, { remoteId, path });
          if (!pushed.ok) {
            return pushed;
          }

          return makeSuccess(pushed.value);
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
            remoteChangeNotificationClients
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
