import { objectEntries } from 'freedom-cast';
import type { PushFile, PushFolderLikeItem, PushItem, RemoteId, SyncablePath } from 'freedom-sync-types';
import { extractSyncableItemTypeFromPath } from 'freedom-sync-types';

import type { RemoteSyncLogEntryPush } from '../../../types/RemoteSyncLogEntry.ts';

export const makeRemoteSyncLogEntryPush = ({
  remoteId,
  path,
  pushed
}: {
  remoteId: RemoteId;
  path: SyncablePath;
  pushed: PushItem;
}): RemoteSyncLogEntryPush => {
  const counts = {
    numHashes: 0,
    numFolders: 0,
    numBundles: 0,
    numFiles: 0,
    numFileDatas: 0
  };

  internalUpdateCounts(path, pushed, counts);

  return { type: 'push', remoteId, path, ...counts };
};

// Helpers

const internalUpdateCounts = (
  path: SyncablePath,
  pushed: PushItem,
  inOutCounts: {
    numHashes: number;
    numFolders: number;
    numBundles: number;
    numFiles: number;
    numFileDatas: number;
  }
) => {
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
      const folderLike = pushed as PushFolderLikeItem;

      for (const [id, subItem] of objectEntries(folderLike.itemsById ?? {})) {
        if (subItem === undefined) {
          continue;
        }

        internalUpdateCounts(path.append(id), subItem, inOutCounts);
      }

      break;
    }

    case 'file': {
      const file = pushed as PushFile;
      if (file.data !== undefined) {
        inOutCounts.numFileDatas += 1;
      }
      break;
    }
  }
};
