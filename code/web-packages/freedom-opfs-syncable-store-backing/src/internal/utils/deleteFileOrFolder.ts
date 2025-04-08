import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';

import { getDirectoryHandle } from './getDirectoryHandle.ts';

export const deleteFileOrFolder = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace, rootHandle: FileSystemDirectoryHandle, ids: readonly SyncableId[]) => {
    const dir = await getDirectoryHandle(rootHandle, ids.slice(0, ids.length - 1));

    await dir.removeEntry(ids[ids.length - 1], { recursive: true });

    return makeSuccess(undefined);
  }
);
