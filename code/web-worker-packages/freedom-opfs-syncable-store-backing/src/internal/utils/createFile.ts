import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';

import type { OpfsLocalItemMetadata } from '../types/OpfsLocalItemMetadata.ts';
import { createMetadataFile } from './createMetadataFile.ts';
import { getFileHandleForSyncablePath } from './getFileHandleForSyncablePath.ts';
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
    const fileHandle = await getFileHandleForSyncablePath(trace, rootHandle, path, { create: true });
    if (!fileHandle.ok) {
      return generalizeFailureResult(trace, fileHandle, 'not-found');
    }

    const wrote = await writeFile(trace, fileHandle.value, { lockKey: path.toString(), data });
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
