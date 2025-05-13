import type { PR } from 'freedom-async';
import { bestEffort, debugTopic, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import { pushToLocal } from 'freedom-local-sync';
import type { PullItem, PullOutOfSyncFolderLikeItem, RemoteId, SyncablePath, SyncGlob } from 'freedom-sync-types';
import { extractSyncableItemTypeFromPath } from 'freedom-sync-types';
import { type MutableSyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../../types/RemoteSyncService.ts';
import type { SyncStrategy } from '../../../types/SyncStrategy.ts';
import { enqueueFollowUpSyncsIfNeeded } from '../enqueueFollowUpSyncsIfNeeded.ts';
import { makeRemoteSyncLogEntryPull } from '../log-entries/makeRemoteSyncLogEntryPull.ts';
import { getSyncPullArgsForGlob } from './getSyncPullArgsForGlob.ts';
import { getSyncPullArgsForStrategy } from './getSyncPullArgsForStrategy.ts';

/** If `glob` is defined, `glob` is used directly.  If not, a strategy will be determined using `syncService.getSyncStrategyForPath`, which
 * will then be used to decide if extra content should be requested. */
export const pullFromRemote = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: MutableSyncableStore; syncService: RemoteSyncService },
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
    DEV: debugTopic('SYNC', (log) => log(trace, `Will pull ${basePath.toShortString()} from remote ${remoteId}`));

    const pullFromRemoteUsingRemoteAccessor = syncService.remoteAccessors[remoteId]?.puller;
    if (pullFromRemoteUsingRemoteAccessor === undefined) {
      return makeFailure(new InternalStateError(trace, { message: `No remote accessor found for ${remoteId}` }));
    }

    const requestArgs = await (glob === undefined
      ? getSyncPullArgsForStrategy(trace, store, {
          basePath,
          strategy: strategy ?? (await syncService.getSyncStrategyForPath('pull', basePath))
        })
      : getSyncPullArgsForGlob(trace, store, { basePath, glob }));
    if (!requestArgs.ok) {
      return requestArgs;
    }

    // TODO: everything pulled needs to be validated -- approved content: just validate the approval itself; not-yet approved content:
    // validate the change against the access control document
    const pulled = await pullFromRemoteUsingRemoteAccessor(trace, requestArgs.value);
    if (!pulled.ok) {
      return pulled;
    }
    DEV: syncService.devLogging.appendLogEntry?.(makeRemoteSyncLogEntryPull({ remoteId, path: basePath, pulled: pulled.value }));

    DEV: debugTopic('SYNC', (log) =>
      log(trace, `Pulled ${basePath.toShortString()}: local and remote are ${pulled.value === 'in-sync' ? 'in sync' : 'out of sync'}`)
    );

    if (pulled.value === 'in-sync') {
      return makeSuccess('in-sync' as const);
    }

    const pushedLocally = await pushToLocal(trace, store, { basePath, item: pulled.value });
    if (!pushedLocally.ok) {
      return pushedLocally;
    }

    const baseItemType = extractSyncableItemTypeFromPath(basePath);
    switch (baseItemType) {
      case 'file':
        return makeSuccess(pulled.value);
      case 'bundle':
      case 'folder': {
        const folderLike = pulled.value as PullOutOfSyncFolderLikeItem;
        await bestEffort(
          trace,
          enqueueFollowUpSyncsIfNeeded(trace, { store, syncService, item: folderLike }, { remoteId, path: basePath })
        );
      }
    }

    return makeSuccess(pushedLocally.value);
  },
  { deepDisableLam: 'not-found' }
);
