import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';

import type { OpfsLocalItemMetadata } from '../types/OpfsLocalItemMetadata.ts';
import { createMetadataFile } from './createMetadataFile.ts';
import { getDirectoryHandle } from './getDirectoryHandle.ts';
import { writeFile } from './writeFile.ts';

export const createFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootHandle: FileSystemDirectoryHandle,
    path: SyncablePath,
    data: Uint8Array,
    metadata: SyncableItemMetadata & OpfsLocalItemMetadata
  ): PR<undefined> => {
    const dir = await getDirectoryHandle(trace, rootHandle, path.parentPath!);
    if (!dir.ok) {
      return generalizeFailureResult(trace, dir, 'not-found');
    }

    const fileHandle = await dir.value.getFileHandle(encodeURIComponent(path.lastId!), { create: true });
    const wrote = await writeFile(trace, fileHandle, { lockKey: path.toString(), data });
    if (!wrote.ok) {
      return wrote;
    }

    const savedMetadata = await createMetadataFile(trace, rootHandle, path, metadata);
    if (!savedMetadata.ok) {
      return savedMetadata;
    }

    return makeSuccess(undefined);
  }
);
