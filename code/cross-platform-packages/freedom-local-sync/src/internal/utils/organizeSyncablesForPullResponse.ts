import { makeAsyncResultFunc, makeFailure, makeSuccess, type PR } from 'freedom-async';
import { sha256HashInfo } from 'freedom-basic-data';
import { objectEntries } from 'freedom-cast';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import type { PullItem, PullOutOfSyncFile, PullOutOfSyncFolderLikeItem, StructHashes, SyncableId, SyncablePath } from 'freedom-sync-types';
import { extractSyncableItemTypeFromId, extractSyncableItemTypeFromPath } from 'freedom-sync-types';
import { disableSyncableValidation, getSyncableAtPath } from 'freedom-syncable-store';
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
    itemsById: Partial<Record<SyncableId, PullItem>>;
  }> => {
    const baseItem = await disableSyncableValidation(getSyncableAtPath)(trace, store, basePath);
    if (!baseItem.ok) {
      return generalizeFailureResult(trace, baseItem, ['not-found', 'untrusted', 'wrong-type']);
    }

    const baseItemType = extractSyncableItemTypeFromPath(basePath);
    switch (baseItemType) {
      case 'file':
        return makeFailure(
          new InternalStateError(trace, { message: `${import.meta.filename} should only be used with folder-like items` })
        );

      case 'bundle':
      case 'folder':
        break;
    }

    const initialSubItemsById = await getInitialSubPullsItemsByIdForFolder(trace, baseItem.value as SyncableFolderLikeAccessor, {
      hashes: localHashesRelativeToBasePath.contents
    });
    if (!initialSubItemsById.ok) {
      return initialSubItemsById;
    }

    const itemsById = initialSubItemsById.value;

    for (const item of items) {
      const relativePathIds = item.path.relativeTo(basePath);
      if (relativePathIds === undefined) {
        continue;
      }

      let itemsCursor = itemsById;
      let hashesCursor: StructHashes | undefined = localHashesRelativeToBasePath;
      let pathSoFar = basePath;
      for (const id of relativePathIds) {
        if (itemsCursor[id] === 'in-sync') {
          break;
        }

        pathSoFar = pathSoFar.append(id);
        hashesCursor = hashesCursor?.contents?.[id];

        const ancestorItem = await disableSyncableValidation(getSyncableAtPath)(trace, store, pathSoFar);
        if (!ancestorItem.ok) {
          return generalizeFailureResult(trace, ancestorItem, ['not-found', 'untrusted', 'wrong-type']);
        }

        const ancestorItemType = extractSyncableItemTypeFromId(id);

        if (itemsCursor[id] === undefined || (typeof itemsCursor[id] === 'string' && sha256HashInfo.is(itemsCursor[id]))) {
          const ancestorItemMetadata = await ancestorItem.value.getMetadata(trace);
          if (!ancestorItemMetadata.ok) {
            return ancestorItemMetadata;
          }

          // If the remote hash matches the hash sent in the request, we can stop looking deeper at this path, since the items are in sync
          if (ancestorItemMetadata.value.hash === hashesCursor?.hash) {
            itemsCursor[id] = 'in-sync';
            break;
          }

          switch (ancestorItemType) {
            case 'file': {
              const fileItem = ancestorItem.value as SyncableFileAccessor;

              let data: Uint8Array | undefined;
              if (sendData) {
                const dataResult = await fileItem.getEncodedBinary(trace);
                if (!dataResult.ok) {
                  return dataResult;
                }

                data = dataResult.value;
              }

              itemsCursor[id] = {
                metadata: ancestorItemMetadata.value,
                sizeBytes: ancestorItemMetadata.value.sizeBytes,
                data
              } satisfies PullOutOfSyncFile;

              break;
            }

            case 'bundle':
            case 'folder': {
              const folderLikeItem = ancestorItem.value as SyncableFolderLikeAccessor;

              const initialSubItemsById = await getInitialSubPullsItemsByIdForFolder(trace, folderLikeItem, {
                hashes: hashesCursor?.contents
              });
              if (!initialSubItemsById.ok) {
                return initialSubItemsById;
              }

              itemsCursor[id] = {
                metadata: ancestorItemMetadata.value,
                itemsById: initialSubItemsById.value
              } satisfies PullOutOfSyncFolderLikeItem;

              break;
            }
          }
        }

        switch (ancestorItemType) {
          case 'file':
            break; // Nothing more to do

          case 'bundle':
          case 'folder':
            itemsCursor = (itemsCursor[id] as PullOutOfSyncFolderLikeItem).itemsById;

            break;
        }
      }
    }

    return makeSuccess({ itemsById });
  }
);

// Helpers

const getInitialSubPullsItemsByIdForFolder = makeAsyncResultFunc(
  [import.meta.filename, 'getInitialSubPullsItemsByIdForFolder'],
  async (
    trace,
    folderLikeItem: SyncableFolderLikeAccessor,
    { hashes }: { hashes: Partial<Record<SyncableId, StructHashes>> | undefined }
  ): PR<Partial<Record<SyncableId, PullItem>>> => {
    const metadataById = await folderLikeItem.getMetadataById(trace);
    if (!metadataById.ok) {
      return metadataById;
    }

    // For any hashes that are inserted here, they may be replaced later if item is further traversed
    const initialSubPullsItemsById: Partial<Record<SyncableId, PullItem>> = {};
    for (const [subItemId, subItemMetadata] of objectEntries(metadataById.value)) {
      if (subItemMetadata === undefined) {
        continue;
      }

      initialSubPullsItemsById[subItemId] = subItemMetadata.hash === hashes?.[subItemId]?.hash ? 'in-sync' : subItemMetadata.hash;
    }

    return makeSuccess(initialSubPullsItemsById);
  }
);
