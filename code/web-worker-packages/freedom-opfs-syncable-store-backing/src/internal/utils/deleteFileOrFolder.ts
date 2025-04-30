import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncablePath } from 'freedom-sync-types';

import { getDirectoryHandle } from './getDirectoryHandle.ts';
import { invalidateDirectoryHandleCache } from './opfs-access-cache.ts';

export const deleteFileOrFolder = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, rootHandle: FileSystemDirectoryHandle, path: SyncablePath) => {
    const dir = await getDirectoryHandle(trace, rootHandle, path.parentPath!);
    if (!dir.ok) {
      return generalizeFailureResult(trace, dir, 'not-found');
    }

    await dir.value.removeEntry(encodeURIComponent(path.lastId!), { recursive: true });

    invalidateDirectoryHandleCache(rootHandle, path);

    return makeSuccess(undefined);
  }
);
