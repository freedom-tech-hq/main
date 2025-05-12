import type { Result } from 'freedom-async';
import { makeSuccess, makeSyncResultFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { objectEntries } from 'freedom-cast';
import type { Trace } from 'freedom-contexts';
import type { PullOutOfSyncFolderLikeItem, PullOutOfSyncItem, SyncablePath } from 'freedom-sync-types';
import { extractSyncableItemTypeFromPath } from 'freedom-sync-types';

/** Returns the hashes by path strings from `remoteMetadataById` recursively */
export const getHashesForPulledAccessControlBundleItemsByPathString = makeSyncResultFunc(
  [import.meta.filename],
  (trace, basePath: SyncablePath, item: PullOutOfSyncItem): Result<Partial<Record<string, Sha256Hash>>> =>
    internalRecursive(trace, basePath, item, {})
);

// Helpers

const internalRecursive = (
  trace: Trace,
  basePath: SyncablePath,
  item: PullOutOfSyncItem,
  out: Partial<Record<string, Sha256Hash>>
): Result<Partial<Record<string, Sha256Hash>>> => {
  const itemType = extractSyncableItemTypeFromPath(basePath);
  switch (itemType) {
    case 'bundle':
    case 'folder': {
      const folderLikeItem = item as PullOutOfSyncFolderLikeItem;

      for (const [id, remoteMetadata] of objectEntries(folderLikeItem.remoteMetadataById)) {
        const hash = remoteMetadata?.hash;
        if (hash !== undefined) {
          out[basePath.append(id).toString()] = hash;
        }
      }

      for (const [id, subitem] of objectEntries(folderLikeItem.itemsById ?? {})) {
        if (subitem !== undefined) {
          internalRecursive(trace, basePath.append(id), subitem, out);
        }
      }

      break;
    }
    case 'file':
      break;
  }

  return makeSuccess(out);
};
