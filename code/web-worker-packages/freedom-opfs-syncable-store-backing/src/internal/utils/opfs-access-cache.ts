import { InMemoryCache } from 'freedom-in-memory-cache';
import { extractSyncableItemTypeFromPath, type SyncablePath } from 'freedom-sync-types';

import { OPFS_DIRECTORY_ACCESS_CACHE_DURATION_MSEC } from '../consts/timings.ts';

const globalCache = new InMemoryCache<string, FileSystemDirectoryHandle>({
  cacheDurationMSec: OPFS_DIRECTORY_ACCESS_CACHE_DURATION_MSEC,
  shouldResetIntervalOnGet: true
});

export const getFromOpfsDirectoryAccessCache = (rootHandle: FileSystemDirectoryHandle, cacheKey: string) =>
  globalCache.get(rootHandle, cacheKey);

export const setOpfsDirectoryAccessCache = (rootHandle: FileSystemDirectoryHandle, cacheKey: string, dir: FileSystemDirectoryHandle) =>
  globalCache.set(rootHandle, cacheKey, dir);

/** Invalidates the cache for the specified rootHandle for the specified path and any deeper paths */
export const invalidateDirectoryHandleCache = (rootHandle: FileSystemDirectoryHandle, path: SyncablePath) => {
  const itemType = extractSyncableItemTypeFromPath(path);

  switch (itemType) {
    case 'bundle':
    case 'folder': {
      const cacheKey = path.toString();
      globalCache.invalidate(rootHandle, cacheKey);
      globalCache.invalidateWithKeyPrefix(rootHandle, `${cacheKey}/`);
      break;
    }

    case 'file':
      break; // Nothing to do
  }
};
