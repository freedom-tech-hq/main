import type { PR } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { PullOutOfSyncFolderLikeItem, RemoteId, SyncablePath, SyncGlob } from 'freedom-sync-types';
import { extractSyncableItemTypeFromPath } from 'freedom-sync-types';
import { type SyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../../../types/RemoteSyncService.ts';
import type { SyncStrategy } from '../../../../types/SyncStrategy.ts';
import { makeRemoteSyncLogEntryPush } from '../../log-entries/makeRemoteSyncLogEntryPush.ts';
import { enqueueFollowUpSyncsIfNeeded } from '../local/enqueueFollowUpSyncsIfNeeded.ts';
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
  ): PR<undefined, 'not-found'> => {
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

    const pushed = await pushToRemoteUsingRemoteAccessor(trace, requestArgs.value);
    if (!pushed.ok) {
      return pushed;
    }
    DEV: syncService.devLogging.appendLogEntry?.(makeRemoteSyncLogEntryPush({ remoteId, path: basePath, pushed: requestArgs.value.item }));

    DEV: debugTopic('SYNC', (log) => log(trace, `Pushed ${basePath.toShortString()}`));

    const itemType = extractSyncableItemTypeFromPath(basePath);
    switch (itemType) {
      case 'file':
        return makeSuccess(undefined);
      case 'bundle':
      case 'folder':
        return await enqueueFollowUpSyncsIfNeeded(
          trace,
          { store, syncService, item: pushed.value as PullOutOfSyncFolderLikeItem },
          { remoteId, path: basePath }
        );
    }
  },
  { deepDisableLam: 'not-found' }
);
