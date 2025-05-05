import { extractSyncableItemTypeFromId, SyncablePath } from 'freedom-sync-types';

/** If this path represents a file, returns a new path with the deepest common folder.  If this path represents a folder, returns the
 * same path */
export const getNearestFolderPath = (path: SyncablePath): SyncablePath => {
  if (path.lastId !== undefined && extractSyncableItemTypeFromId(path.lastId) === 'folder') {
    return path;
  }

  const numIds = path.ids.length;
  for (let index = numIds - 1; index >= 0; index -= 1) {
    if (extractSyncableItemTypeFromId(path.ids[index]) === 'folder') {
      return new SyncablePath(path.storageRootId, ...path.ids.slice(0, index + 1));
    }
  }

  return new SyncablePath(path.storageRootId);
};
