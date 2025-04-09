import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { type SyncablePath } from 'freedom-sync-types';

import { getDirectoryHandle } from './getDirectoryHandle.ts';

export const getDirectoryHandleAndFilenameForMetadataFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootHandle: FileSystemDirectoryHandle,
    path: SyncablePath
  ): PR<{ dir: FileSystemDirectoryHandle; filename: string; metaFileLockKey: string }> => {
    if (path.ids.length === 0) {
      return makeSuccess({
        dir: rootHandle,
        filename: 'metadata.json',
        metaFileLockKey: `${path.toString()}/metadata.json`
      });
    }

    const lastId = path.lastId!;
    const dir = await getDirectoryHandle(trace, rootHandle, path.parentPath!);
    if (!dir.ok) {
      return generalizeFailureResult(trace, dir, 'not-found');
    }
    return makeSuccess({
      dir: dir.value,
      filename: `metadata.${encodeURIComponent(lastId)}.json`,
      metaFileLockKey: `${path.parentPath!.toString()}/metadata.${encodeURIComponent(lastId)}.json`
    });
  }
);
