import { allResultsMapped, bestEffort, callAsyncResultFunc, debugTopic, makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import { objectEntries, objectKeys } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { PullOutOfSyncFolderLikeItem, RemoteId, SyncablePath, SyncGlob } from 'freedom-sync-types';
import { syncableItemTypes, SyncablePathPattern } from 'freedom-sync-types';
import { disableSyncableValidation, getSyncableAtPath } from 'freedom-syncable-store';
import type { SyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../types/RemoteSyncService.ts';

/**
 * Called by `pushBundleToLocal` and `pushFolderToLocal` after they handle initial processing
 *
 * Uses the specified item's `remoteMetadataById` field to determine which remote items remain out of sync and which remote items are
 * missing.  For each out-of-sync or missing item, this uses `syncService.shouldPullFromRemote` or `syncService.shouldPushToRemote` to
 * determine if additional work should automatically be enqueued.
 */
export const enqueueFollowUpSyncsIfNeeded = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    { store, syncService, item }: { store: SyncableStore; syncService: RemoteSyncService; item: PullOutOfSyncFolderLikeItem },
    { remoteId, path }: { remoteId: RemoteId; path: SyncablePath }
  ): PR<undefined> => {
    const localFolderLikeItem = await disableSyncableValidation(getSyncableAtPath)(trace, store, path, syncableItemTypes.exclude('file'));
    if (!localFolderLikeItem.ok) {
      return generalizeFailureResult(trace, localFolderLikeItem, ['not-found', 'untrusted', 'wrong-type']);
    }

    const localMetadataById = await localFolderLikeItem.value.getMetadataById(trace);
    if (!localMetadataById.ok) {
      return localMetadataById;
    }

    const remoteMetadataByIdEntries = objectEntries(item.remoteMetadataById);
    if (remoteMetadataByIdEntries.length > 0) {
      const outOfSyncEntries = remoteMetadataByIdEntries.filter(
        ([id, remoteMetadata]) => remoteMetadata !== undefined && localMetadataById.value[id]?.hash !== remoteMetadata.hash
      );
      if (outOfSyncEntries.length > 0) {
        DEV: debugTopic('SYNC', (log) =>
          log(trace, `Pulled ${path.toShortString()}: local and remote are out of sync.  May try to pull ${outOfSyncEntries.length} items`)
        );

        // For each out-of-sync entry, checking if the sync service wants to pull it from the remote, and if so, enqueueing the pull
        await bestEffort(
          trace,
          allResultsMapped(trace, outOfSyncEntries, {}, async (_trace, [id, remoteMetadata]) => {
            const shouldPullFromRemote = await syncService.shouldPullFromRemote({ store, remoteId, path: path.append(id) });
            if (shouldPullFromRemote === false) {
              return makeSuccess(undefined);
            }

            return syncService.enqueuePullFromRemotes(trace, {
              remoteId,
              basePath: path.append(id),
              hash: remoteMetadata?.hash,
              strategy: shouldPullFromRemote.strategy
            });
          })
        );
      } else {
        DEV: debugTopic('SYNC', (log) => log(trace, `Pulled ${path.toShortString()}: local has all remote content`));
      }
    }

    const remotelyMissingIds = objectKeys(localMetadataById.value).filter((id) => item.remoteMetadataById?.[id] === undefined);
    if (remotelyMissingIds.length > 0) {
      DEV: debugTopic('SYNC', (log) =>
        log(
          trace,
          `Pulled ${path.toShortString()}: local and remote are out of sync.  May try to push ${remotelyMissingIds.length} items missing from remote`
        )
      );

      const batchGlob: SyncGlob = { include: [], exclude: [] };

      // For each missing item, checking if the sync service wants to push it to the remote, and if so, enqueueing the push
      await bestEffort(
        trace,
        allResultsMapped(trace, remotelyMissingIds, {}, async (_trace, id) => {
          const hash = localMetadataById.value[id]?.hash;
          if (hash === undefined) {
            return makeSuccess(undefined);
          }

          const shouldPushToRemote = await syncService.shouldPushToRemote({ store, remoteId, path: path.append(id) });
          if (shouldPushToRemote === false) {
            return makeSuccess(undefined);
          }

          switch (shouldPushToRemote.strategy) {
            case 'item':
              return syncService.enqueuePushToRemotes(trace, {
                remoteId,
                basePath: path.append(id),
                hash,
                strategy: shouldPushToRemote.strategy
              });

            case 'level':
              batchGlob.include.push(new SyncablePathPattern(id));
              return makeSuccess(undefined);

            case 'stack':
              batchGlob.include.push(new SyncablePathPattern(id, '**'));
              return makeSuccess(undefined);
          }
        })
      );

      if (batchGlob.include.length > 0) {
        await bestEffort(
          trace,
          callAsyncResultFunc(trace, {}, async (trace) => {
            const metadata = await localFolderLikeItem.value.getMetadata(trace);
            if (!metadata.ok) {
              return metadata;
            }

            return syncService.enqueuePushToRemotes(trace, {
              remoteId,
              basePath: path,
              hash: metadata.value.hash,
              glob: batchGlob
            });
          })
        );
      }
    }

    return makeSuccess(undefined);
  }
);
