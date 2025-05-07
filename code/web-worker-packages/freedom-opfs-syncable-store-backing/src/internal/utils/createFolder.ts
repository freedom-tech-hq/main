import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStoreBackingItemMetadata } from 'freedom-syncable-store-backing-types';

import { createMetadataFile } from './createMetadataFile.ts';
import { getDirectoryHandle } from './getDirectoryHandle.ts';

export const createFolder = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, rootHandle: FileSystemDirectoryHandle, path: SyncablePath, metadata: SyncableStoreBackingItemMetadata): PR<undefined> => {
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
