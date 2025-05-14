import type { PR, Result } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeSuccess, makeSyncResultFunc } from 'freedom-async';
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
import { pullFromRemotes } from '../internal/utils/pull/remote/pullFromRemotes.ts';
import { pushToRemotes } from '../internal/utils/push/remote/pushToRemotes.ts';
import type { GetSyncStrategyForPathFunc } from '../types/GetSyncStrategyForPathFunc.ts';
import type { RemoteSyncLogEntry } from '../types/RemoteSyncLogEntry.ts';
import type { RemoteSyncService } from '../types/RemoteSyncService.ts';
import type { ShouldPullFromRemoteFunc } from '../types/ShouldPullFromRemoteFunc.ts';
import type { ShouldPushToRemoteFunc } from '../types/ShouldPushToRemoteFunc.ts';

export interface MakeSyncServiceArgs {
  store: MutableSyncableStore;
  remoteConnections: RemoteConnection[];
  getSyncStrategyForPath: GetSyncStrategyForPathFunc;
  shouldPullFromRemote: ShouldPullFromRemoteFunc;
  shouldPushToRemote: ShouldPushToRemoteFunc;
  shouldRecordLogs?: boolean;
  /** Called at the end of the start procedure */
  onStart?: (args: { syncService: RemoteSyncService }) => TypeOrPromisedType<void>;
  /** Called at the beginning of the stop procedure */
  onStop?: (args: { syncService: RemoteSyncService }) => TypeOrPromisedType<void>;
}

export const makeSyncService = makeSyncResultFunc(
  [import.meta.filename],
  (
    trace,
    {
      store,
      remoteConnections,
      getSyncStrategyForPath,
      shouldPullFromRemote,
      shouldPushToRemote,
      shouldRecordLogs = false,
      onStart,
      onStop
    }: MakeSyncServiceArgs
  ): Result<RemoteSyncService> => {
    const pullQueue = disableLam('not-found', (trace) => new TaskQueue('[SYNC] pull-queue', trace))(trace);
    const pushQueue = new TaskQueue('[SYNC] push-queue', trace);

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
      shouldPushToRemote,

      enqueuePullFromRemotes: makeSyncResultFunc(
        [import.meta.filename, 'enqueuePullFromRemotes'],
        (trace, { remoteId = defaultRemoteId, basePath, hash, glob, strategy, priority = 'default' }) => {
          const key = basePath.toString();
          const version = JSON.stringify({
            remoteId,
            hash,
            strategy: glob !== undefined ? undefined : strategy,
            glob:
              glob !== undefined
                ? {
                    include: glob.include.map((pattern) => pattern.toString()).sort(),
                    exclude: glob.exclude?.map((pattern) => pattern.toString()).sort()
                  }
                : undefined
          });

          DEV: debugTopic('SYNC', (log) =>
            log(trace, `Pull enqueued ${basePath.toShortString()} for ${remoteId !== undefined ? `remote ${remoteId}` : 'any remote'}`)
          );

          pullQueue.add(
            { key, version, priority },
            async (trace) => await service.pullFromRemotes(trace, { remoteId, basePath, glob, strategy })
          );

          return makeSuccess(undefined);
        },
        { deepDisableLam: 'not-found' }
      ),

      enqueuePushToRemotes: makeSyncResultFunc(
        [import.meta.filename, 'enqueuePushToRemotes'],
        (trace, { remoteId = defaultRemoteId, basePath, hash, glob, strategy, priority = 'default' }) => {
          const key = basePath.toString();
          const version = JSON.stringify({
            remoteId,
            hash,
            strategy: glob !== undefined ? undefined : strategy,
            glob:
              glob !== undefined
                ? {
                    include: glob.include.map((pattern) => pattern.toString()).sort(),
                    exclude: glob.exclude?.map((pattern) => pattern.toString()).sort()
                  }
                : undefined
          });

          DEV: debugTopic('SYNC', (log) =>
            log(trace, `Push enqueued ${basePath.toShortString()} for ${remoteId !== undefined ? `remote ${remoteId}` : 'any remote'}`)
          );

          pushQueue.add(
            { key, version, priority },
            async (trace) => await pushToRemotes(trace, { store, syncService: service }, { remoteId, basePath, glob, strategy })
          );

          return makeSuccess(undefined);
        }
      ),

      pullFromRemotes: makeAsyncResultFunc(
        [import.meta.filename, 'pullFromRemotes'],
        async (trace, { remoteId = defaultRemoteId, basePath, glob, strategy }): PR<undefined, 'not-found'> =>
          await pullFromRemotes(trace, { store, syncService: service }, { remoteId, basePath, glob, strategy }),
        { deepDisableLam: 'not-found' }
      ),

      pushToRemotes: makeAsyncResultFunc(
        [import.meta.filename, 'pushToRemotes'],
        async (trace, { remoteId = defaultRemoteId, basePath, glob, strategy }): PR<undefined, 'not-found'> =>
          await pushToRemotes(trace, { store, syncService: service }, { remoteId, basePath, glob, strategy })
      ),

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

      devLogging: makeDevLoggingSupport<RemoteSyncLogEntry>(shouldRecordLogs)
    } satisfies RemoteSyncService;

    return makeSuccess(service);
  }
);
