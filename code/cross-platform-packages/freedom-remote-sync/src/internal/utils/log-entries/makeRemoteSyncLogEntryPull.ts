import { objectEntries, objectValues } from 'freedom-cast';
import type { PullItem, PullOutOfSyncFile, PullOutOfSyncFolderLikeItem, RemoteId, SyncablePath } from 'freedom-sync-types';
import { extractSyncableItemTypeFromPath } from 'freedom-sync-types';

import type { RemoteSyncLogEntryPull } from '../../../types/RemoteSyncLogEntry.ts';

export const makeRemoteSyncLogEntryPull = ({
  remoteId,
  path,
  pulled
}: {
  remoteId: RemoteId;
  path: SyncablePath;
  pulled: PullItem;
}): RemoteSyncLogEntryPull => {
  const counts = {
    numHashes: 0,
    numFolders: 0,
    numBundles: 0,
    numFiles: 0,
    numFileDatas: 0
  };

  internalUpdateCounts(path, pulled, counts);

  return { type: 'pull', remoteId, path, outOfSync: pulled !== 'in-sync', ...counts };
};

// Helpers

const internalUpdateCounts = (
  path: SyncablePath,
  pulled: PullItem,
  inOutCounts: {
    numHashes: number;
    numFolders: number;
    numBundles: number;
    numFiles: number;
    numFileDatas: number;
  }
) => {
  if (pulled !== 'in-sync') {
    const itemType = extractSyncableItemTypeFromPath(path);
    switch (itemType) {
      case 'folder':
        inOutCounts.numFolders += 1;
        break;
      case 'bundle':
        inOutCounts.numBundles += 1;
        break;
      case 'file':
        inOutCounts.numFiles += 1;
        break;
    }

    switch (itemType) {
      case 'folder':
      case 'bundle': {
        const folderLike = pulled as PullOutOfSyncFolderLikeItem;

        inOutCounts.numHashes += objectValues(folderLike.remoteMetadataById).reduce(
          (out, remoteMetadata) => out + (remoteMetadata !== undefined ? 1 : 0),
          0
        );

        for (const [id, subItem] of objectEntries(folderLike.itemsById ?? {})) {
          if (subItem === undefined) {
            continue;
          }

          internalUpdateCounts(path.append(id), subItem, inOutCounts);
        }

        break;
      }

      case 'file': {
        const file = pulled as PullOutOfSyncFile;
        if (file.data !== undefined) {
          inOutCounts.numFileDatas += 1;
        }
        break;
      }
    }
  }
};
