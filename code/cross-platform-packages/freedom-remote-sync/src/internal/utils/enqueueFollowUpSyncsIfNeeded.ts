import { allResultsMapped, bestEffort, callAsyncResultFunc, debugTopic, makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { sha256HashInfo } from 'freedom-basic-data';
import { objectEntries, objectKeys } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { PullOutOfSyncFolderLikeItem, PullOutOfSyncItem, RemoteId, SyncableId, SyncablePath, SyncGlob } from 'freedom-sync-types';
import { extractSyncableItemTypeFromId, folderLikeSyncableItemTypes, SyncablePathPattern } from 'freedom-sync-types';
import { disableSyncableValidation, getSyncableAtPath } from 'freedom-syncable-store';
import type { SyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../types/RemoteSyncService.ts';

export const enqueueFollowUpSyncsIfNeeded = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    { store, syncService, item }: { store: SyncableStore; syncService: RemoteSyncService; item: PullOutOfSyncFolderLikeItem },
    { remoteId, path }: { remoteId: RemoteId; path: SyncablePath }
  ): PR<undefined> => {
    const localFolderLikeItem = await disableSyncableValidation(getSyncableAtPath)(trace, store, path, folderLikeSyncableItemTypes);
    if (!localFolderLikeItem.ok) {
      return generalizeFailureResult(trace, localFolderLikeItem, ['not-found', 'untrusted', 'wrong-type']);
    }

    const localMetadataById = await localFolderLikeItem.value.getMetadataById(trace);
    if (!localMetadataById.ok) {
      return localMetadataById;
    }

    const itemsByIdsEntries = objectEntries(item.itemsById);
    if (itemsByIdsEntries.length > 0) {
      const outOfSyncEntries = itemsByIdsEntries.filter(([_id, pullItem]) => pullItem !== undefined && pullItem !== 'in-sync') as Array<
        [SyncableId, PullOutOfSyncItem]
      >;
      const outOfSyncHashOnlyEntries = outOfSyncEntries.filter(
        ([id, pullItem]) => typeof pullItem === 'string' && sha256HashInfo.is(pullItem) && localMetadataById.value[id]?.hash !== pullItem
      ) as Array<[SyncableId, Sha256Hash]>;
      const outOfSyncNestedEntries = outOfSyncEntries.filter(
        ([id, pullItem]) => typeof pullItem !== 'string' && folderLikeSyncableItemTypes.has(extractSyncableItemTypeFromId(id))
      ) as Array<[SyncableId, PullOutOfSyncFolderLikeItem]>;

      if (outOfSyncHashOnlyEntries.length > 0) {
        DEV: debugTopic('SYNC', (log) =>
          log(
            trace,
            `Pulled ${path.toShortString()}: local and remote are out of sync.  May try to pull ${outOfSyncHashOnlyEntries.length} items`
          )
        );
      }

      if (outOfSyncHashOnlyEntries.length > 0) {
        // For each out-of-sync entry, checking if the sync service wants to pull it from the remote, and if so, enqueueing the pull
        await bestEffort(
          trace,
          allResultsMapped(trace, outOfSyncHashOnlyEntries, {}, async (_trace, [id, remoteHash]) => {
            const shouldPullFromRemote = await syncService.shouldPullFromRemote({ store, remoteId, path: path.append(id) });
            if (shouldPullFromRemote === false) {
              return makeSuccess(undefined);
            }

            return syncService.enqueuePullFromRemotes(trace, {
              remoteId,
              basePath: path.append(id),
              hash: remoteHash,
              strategy: shouldPullFromRemote.strategy
            });
          })
        );
      }

      if (outOfSyncNestedEntries.length > 0) {
        await bestEffort(
          trace,
          allResultsMapped(
            trace,
            outOfSyncNestedEntries,
            {},
            async (trace, [id, pullItem]) =>
              await enqueueFollowUpSyncsIfNeeded(trace, { store, syncService, item: pullItem }, { remoteId, path: path.append(id) })
          )
        );
      }
    }

    const remotelyMissingIds = objectKeys(localMetadataById.value).filter((id) => item.itemsById?.[id] === undefined);
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
