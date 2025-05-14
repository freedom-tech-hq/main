import type { PR } from 'freedom-async';
import { bestEffort, debugTopic, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { PullItem, PullOutOfSyncFolderLikeItem, RemoteId, SyncablePath, SyncGlob } from 'freedom-sync-types';
import { extractSyncableItemTypeFromPath, pullItemSchema, syncPushArgsSchema } from 'freedom-sync-types';
import { type SyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../../types/RemoteSyncService.ts';
import type { SyncStrategy } from '../../../types/SyncStrategy.ts';
import { enqueueFollowUpSyncsIfNeeded } from '../enqueueFollowUpSyncsIfNeeded.ts';
import { makeRemoteSyncLogEntryPush } from '../log-entries/makeRemoteSyncLogEntryPush.ts';
import { getSyncPushArgsForGlob } from './getSyncPushArgsForGlob.ts';
import { getSyncPushArgsForStrategy } from './getSyncPushArgsForStrategy.ts';

export const pushToRemote = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: SyncableStore; syncService: RemoteSyncService },
    {
      remoteId,
      basePath,
      glob,
      strategy
    }: {
      remoteId: RemoteId;
      basePath: SyncablePath;
      glob?: SyncGlob;
      strategy?: SyncStrategy;
    }
  ): PR<PullItem, 'not-found'> => {
    DEV: debugTopic('SYNC', (log) => log(trace, `Will push ${basePath.toShortString()} to remote ${remoteId}`));

    const pushToRemoteUsingRemoteAccessor = syncService.remoteAccessors[remoteId]?.pusher;
    if (pushToRemoteUsingRemoteAccessor === undefined) {
      return makeFailure(new InternalStateError(trace, { message: `No remote accessor found for ${remoteId}` }));
    }

    const requestArgs = await (glob === undefined
      ? getSyncPushArgsForStrategy(
          trace,
          { store, syncService },
          { remoteId, basePath, strategy: strategy ?? (await syncService.getSyncStrategyForPath('push', basePath)) }
        )
      : getSyncPushArgsForGlob(trace, { store, syncService }, { remoteId, basePath, glob }));
    if (!requestArgs.ok) {
      return requestArgs;
    }

    DEV: debugTopic('SYNC_COMM', (log) =>
      log(trace, `Pushing ${basePath.toShortString()} with args: ${syncPushArgsSchema.stringify(requestArgs.value)}`)
    );
    const pushed = await pushToRemoteUsingRemoteAccessor(trace, requestArgs.value);
    if (!pushed.ok) {
      return pushed;
    }
    DEV: syncService.devLogging.appendLogEntry?.(makeRemoteSyncLogEntryPush({ remoteId, path: basePath, pushed: requestArgs.value.item }));
    DEV: debugTopic('SYNC_COMM', (log) =>
      log(trace, `Pushed ${basePath.toShortString()} with response: ${pullItemSchema.stringify(pushed.value)}`)
    );

    DEV: debugTopic('SYNC', (log) => log(trace, `Pushed ${basePath.toShortString()}`));

    if (pushed.value === 'in-sync') {
      return makeSuccess('in-sync' as const);
    }

    const unpauseSyncService = syncService.pause();
    try {
      const itemType = extractSyncableItemTypeFromPath(basePath);
      switch (itemType) {
        case 'file':
          return makeSuccess(pushed.value);
        case 'bundle':
        case 'folder':
          await bestEffort(
            trace,
            enqueueFollowUpSyncsIfNeeded(
              trace,
              { store, syncService, item: pushed.value as PullOutOfSyncFolderLikeItem },
              { remoteId, path: basePath }
            )
          );
      }
    } finally {
      unpauseSyncService();
    }

    return makeSuccess(pushed.value);
  },
  { deepDisableLam: 'not-found' }
);
