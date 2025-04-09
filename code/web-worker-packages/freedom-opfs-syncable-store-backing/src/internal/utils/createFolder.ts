import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';

import type { OpfsLocalItemMetadata } from '../types/OpfsLocalItemMetadata.ts';
import { createMetadataFile } from './createMetadataFile.ts';
import { getDirectoryHandle } from './getDirectoryHandle.ts';

export const createFolder = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootHandle: FileSystemDirectoryHandle,
    path: SyncablePath,
    metadata: SyncableItemMetadata & OpfsLocalItemMetadata
  ): PR<undefined> => {
    const dir = await getDirectoryHandle(trace, rootHandle, path.parentPath!);
    if (!dir.ok) {
      return generalizeFailureResult(trace, dir, 'not-found');
    }

    await dir.value.getDirectoryHandle(encodeURIComponent(path.lastId!), { create: true });

    const savedMetadata = await createMetadataFile(trace, rootHandle, path, metadata);
    if (!savedMetadata.ok) {
      return savedMetadata;
    }

    return makeSuccess(undefined);
  }
);
