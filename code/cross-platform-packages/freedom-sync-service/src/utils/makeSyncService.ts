import type { PR } from 'freedom-async';
import { debugTopic, excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { objectKeys } from 'freedom-cast';
import { makeDevLoggingSupport } from 'freedom-dev-logging-support';
import type { RemoteAccessor, RemoteConnection, RemoteId } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { TaskQueue } from 'freedom-task-queue';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import { noop } from 'lodash-es';
import type { TypeOrPromisedType } from 'yaschema';

import { DEFAULT_MAX_PULL_CONCURRENCY, DEFAULT_MAX_PUSH_CONCURRENCY } from '../consts/concurrency.ts';
import { attachSyncServiceToSyncableStore } from '../internal/utils/attachSyncServiceToSyncableStore.ts';
import { pullSyncableFromRemotes } from '../internal/utils/pullSyncableFromRemotes.ts';
import { pushSyncableToRemotes } from '../internal/utils/pushSyncableToRemotes.ts';
import type { GetSyncStrategyForPathFunc } from '../types/GetSyncStrategyForPathFunc.ts';
import type { ShouldPullFromRemoteFunc } from '../types/ShouldPullFromRemoteFunc.ts';
import type { ShouldPushToAllRemotesFunc } from '../types/ShouldPushToAllRemotesFunc.ts';
import type { SyncService } from '../types/SyncService.ts';
import type { SyncServiceLogEntry } from '../types/SyncServiceLogEntry.ts';

export interface MakeSyncServiceArgs {
  store: MutableSyncableStore;
  remoteConnections: RemoteConnection[];
  getSyncStrategyForPath: GetSyncStrategyForPathFunc;
  shouldPullFromRemote: ShouldPullFromRemoteFunc;
  shouldPushToAllRemotes: ShouldPushToAllRemotesFunc;
  shouldRecordLogs?: boolean;
  /** Called at the end of the start procedure */
  onStart?: (args: { syncService: SyncService }) => TypeOrPromisedType<void>;
  /** Called at the beginning of the stop procedure */
  onStop?: (args: { syncService: SyncService }) => TypeOrPromisedType<void>;
}

export const makeSyncService = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      store,
      remoteConnections,
      getSyncStrategyForPath,
      shouldPullFromRemote,
      shouldPushToAllRemotes,
      shouldRecordLogs = false,
      onStart,
      onStop
    }: MakeSyncServiceArgs
  ): PR<SyncService> => {
    const pullQueue = new TaskQueue('[SYNC] pull-queue', trace);
    const pushQueue = disableLam('not-found', (trace) => new TaskQueue('[SYNC] push-queue', trace))(trace);

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

      getSyncStrategyForPath,
      shouldPullFromRemote,
      shouldPushToAllRemotes,

      pullFromRemotes: ({ remoteId = defaultRemoteId, path, hash, priority = 'default' }) => {
        const key = path.toString();
        const version = JSON.stringify({ remoteId, hash });

        DEV: debugTopic('SYNC', (log) =>
          log(`Pull enqueued ${path.toShortString()} for ${remoteId !== undefined ? `remote ${remoteId}` : 'any remote'}`)
        );

        pullQueue.add({ key, version, priority }, async (trace) => {
          const pulled = await disableLam('not-found', pullSyncableFromRemotes)(trace, { store, syncService: service }, { remoteId, path });
          if (!pulled.ok) {
            if (pulled.value.errorCode === 'not-found') {
              return makeSuccess(undefined);
            }
            return excludeFailureResult(pulled, 'not-found');
          }

          return makeSuccess(undefined);
        });
      },

      pushToRemotes: ({ remoteId = defaultRemoteId, path, hash, priority = 'default' }) => {
        const key = path.toString();
        const version = JSON.stringify({ remoteId, hash });

        DEV: debugTopic('SYNC', (log) =>
          log(`Push enqueued ${path.toShortString()} for ${remoteId !== undefined ? `remote ${remoteId}` : 'any remote'}`)
        );

        pushQueue.add({ key, version, priority }, async (trace) => {
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

          await onStart?.({ syncService: service });

          return makeSuccess(undefined);
        }
      ),

      stop: makeAsyncResultFunc([import.meta.filename, 'stop'], async (_trace) => {
        await onStop?.({ syncService: service });

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
