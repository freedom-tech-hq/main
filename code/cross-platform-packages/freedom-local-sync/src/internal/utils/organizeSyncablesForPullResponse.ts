import { allResultsMapped, makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import {
  extractSyncableItemTypeFromId,
  type LocalItemMetadata,
  type PullOutOfSyncFile,
  type PullOutOfSyncFolderLikeItem,
  type PullOutOfSyncItem,
  type StructHashes,
  type SyncableId,
  type SyncableItemMetadata,
  type SyncablePath
} from 'freedom-sync-types';
import { getMetadataAtPath, getSyncableAtPath } from 'freedom-syncable-store';
import type { SyncableFileAccessor, SyncableFolderLikeAccessor, SyncableItemAccessor, SyncableStore } from 'freedom-syncable-store-types';

export const organizeSyncablesForPullResponse = makeAsyncResultFunc(
  [import.meta.filename, 'organizeSyncablesForPullResponse'],
  async (
    trace,
    store: SyncableStore,
    {
      basePath,
      items,
      localHashesRelativeToBasePath,
      sendData
    }: { basePath: SyncablePath; items: SyncableItemAccessor[]; localHashesRelativeToBasePath: StructHashes; sendData: boolean }
  ): PR<{
    itemsById?: Partial<Record<SyncableId, PullOutOfSyncItem>>;
  }> => {
    const itemsById: Partial<Record<SyncableId, PullOutOfSyncItem>> = {};

    const processed = await allResultsMapped(trace, items, {}, async (trace, item): PR<undefined> => {
      const relativePathIds = item.path.relativeTo(basePath);
      if (relativePathIds === undefined) {
        return makeSuccess(undefined);
      }

      let itemsCursor = itemsById;
      let hashesCursor: StructHashes | undefined = localHashesRelativeToBasePath;
      let pathSoFar = basePath;
      for (const id of relativePathIds) {
        pathSoFar = pathSoFar.append(id);

        const ancestorItem = await getSyncableAtPath(trace, store, pathSoFar);
        if (!ancestorItem.ok) {
          return generalizeFailureResult(trace, ancestorItem, ['not-found', 'untrusted', 'wrong-type']);
        }

        const ancestorItemType = extractSyncableItemTypeFromId(id);

        let metadata: (SyncableItemMetadata & LocalItemMetadata) | undefined;
        if (itemsCursor[id] === undefined) {
          const metadataResult = await getMetadataAtPath(trace, store, pathSoFar);
          if (!metadataResult.ok) {
            return generalizeFailureResult(trace, metadataResult, ['not-found', 'untrusted', 'wrong-type']);
          }
          metadata = metadataResult.value;

          hashesCursor = hashesCursor?.contents?.[id];

          // If the remote hash matches the hash sent in the request, we can stop looking deeper at this path, since the items are in sync
          if (metadataResult.value.hash === hashesCursor?.hash) {
            break;
          }
        }

        switch (ancestorItemType) {
          case 'bundle':
          case 'folder': {
            const folderLikeItem = ancestorItem.value as SyncableFolderLikeAccessor;

            if (itemsCursor[id] === undefined) {
              const localMetadataById = await folderLikeItem.getMetadataById(trace);
              if (!localMetadataById.ok) {
                return localMetadataById;
              }

              itemsCursor[id] = {
                metadata: metadata!,
                itemsById: {},
                remoteMetadataById: localMetadataById.value
              } satisfies PullOutOfSyncFolderLikeItem;
            }

            const outOfSyncFolderLikeItem = itemsCursor[id] as PullOutOfSyncFolderLikeItem;

            itemsCursor = outOfSyncFolderLikeItem.itemsById!;

            break;
          }
          case 'file': {
            const fileItem = ancestorItem.value as SyncableFileAccessor;

            if (itemsCursor[id] === undefined) {
              let data: Uint8Array | undefined;
              if (sendData) {
                const dataResult = await fileItem.getEncodedBinary(trace);
                if (!dataResult.ok) {
                  return dataResult;
                }

                data = dataResult.value;
              }

              itemsCursor[id] = { metadata: metadata!, sizeBytes: metadata!.sizeBytes, data } satisfies PullOutOfSyncFile;
            }
          }
        }
      }

      return makeSuccess(undefined);
    });
    if (!processed.ok) {
      return processed;
    }

    return makeSuccess({ itemsById });
  }
);
