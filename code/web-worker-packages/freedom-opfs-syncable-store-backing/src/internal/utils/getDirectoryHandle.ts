import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import { SyncablePath } from 'freedom-sync-types';

import { getFromOpfsDirectoryAccessCache, setOpfsDirectoryAccessCache } from './opfs-access-cache.ts';

export const getDirectoryHandle = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, rootHandle: FileSystemDirectoryHandle, path: SyncablePath): PR<FileSystemDirectoryHandle, 'not-found'> => {
    const cacheKey = path.toString();

    const cached = getFromOpfsDirectoryAccessCache(rootHandle, cacheKey);
    if (cached !== undefined) {
      return makeSuccess(cached);
    }

    let dir = rootHandle;
    try {
      let pathSoFar = new SyncablePath(path.storageRootId);
      for (const id of path.ids) {
        pathSoFar = pathSoFar.append(id);

        const subCacheKey = pathSoFar.toString();
        const subCached = getFromOpfsDirectoryAccessCache(rootHandle, subCacheKey);
        if (subCached !== undefined) {
          dir = subCached;
        } else {
          dir = await dir.getDirectoryHandle(encodeURIComponent(id));
          setOpfsDirectoryAccessCache(rootHandle, subCacheKey, dir);
        }
      }
    } catch (e) {
      return makeFailure(
        new NotFoundError(trace, {
          message: `Failed to get directory at ${cacheKey}`,
          cause: new GeneralError(trace, e),
          errorCode: 'not-found'
        })
      );
    }

    setOpfsDirectoryAccessCache(rootHandle, cacheKey, dir);

    return makeSuccess(dir);
  }
);
