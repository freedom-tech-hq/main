import { debugTopic, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { LocalItemMetadata, PullOutOfSyncItem, StructHashes, SyncableId, SyncableItemMetadata, SyncGlob } from 'freedom-sync-types';
import { findSyncables } from 'freedom-syncable-store';
import type { SyncableFolderLikeAccessor, SyncableStore } from 'freedom-syncable-store-types';

import { organizeSyncablesForPullResponse } from './organizeSyncablesForPullResponse.ts';

export const pullFolderLikeItemFromLocal = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    userFs: SyncableStore,
    item: SyncableFolderLikeAccessor,
    {
      metadata,
      localHashesRelativeToBasePath,
      glob,
      sendData
    }: {
      metadata: SyncableItemMetadata & LocalItemMetadata;
      localHashesRelativeToBasePath: StructHashes;
      glob?: SyncGlob;
      sendData: boolean;
    }
  ) => {
    DEV: debugTopic('SYNC', (log) => log(trace, `Pulling ${item.path.toShortString()} from local`));

    const remoteMetadataById = await item.getMetadataById(trace);
    if (!remoteMetadataById.ok) {
      return remoteMetadataById;
    }

    let itemsById: Partial<Record<SyncableId, PullOutOfSyncItem>> | undefined;

    if (glob !== undefined) {
      const found = await findSyncables(trace, userFs, { basePath: item.path, glob });
      if (!found.ok) {
        return found;
      }

      const organized = await organizeSyncablesForPullResponse(trace, userFs, {
        basePath: item.path,
        items: found.value,
        localHashesRelativeToBasePath,
        sendData
      });
      if (!organized.ok) {
        return organized;
      }

      itemsById = organized.value.itemsById;
    }

    return makeSuccess({ metadata, remoteMetadataById: remoteMetadataById.value, contentById: itemsById });
  }
);
