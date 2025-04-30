import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';

import { getDirectoryHandle } from './getDirectoryHandle.ts';
import { getFileHandleForDirectoryHandleAndFilename } from './getFileHandleForDirectoryHandleAndFilename.ts';

export const getFileHandleForSyncablePath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootHandle: FileSystemDirectoryHandle,
    path: SyncablePath,
    options: { create?: boolean } = {}
  ): PR<FileSystemFileHandle, 'not-found'> => {
    const dir = await getDirectoryHandle(trace, rootHandle, path.parentPath!);
    if (!dir.ok) {
      return dir;
    }

    return await getFileHandleForDirectoryHandleAndFilename(trace, dir.value, encodeURIComponent(path.lastId!), options);
  }
);
