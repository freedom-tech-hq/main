import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';

import type { OpfsLocalItemMetadata } from '../types/OpfsLocalItemMetadata.ts';
import { createMetadataFile } from './createMetadataFile.ts';
import { getDirectoryHandle } from './getDirectoryHandle.ts';

export const createFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootHandle: FileSystemDirectoryHandle,
    ids: readonly SyncableId[],
    data: Uint8Array,
    metadata: SyncableItemMetadata & OpfsLocalItemMetadata
  ): PR<undefined> => {
    const dir = await getDirectoryHandle(rootHandle, ids.slice(0, ids.length - 1));

    const fileHandle = await dir.getFileHandle(ids[ids.length - 1], { create: true });
    const writeStream = await fileHandle.createWritable();
    await writeStream.write(data);

    const savedMetadata = await createMetadataFile(trace, rootHandle, ids, metadata);
    if (!savedMetadata.ok) {
      return savedMetadata;
    }

    return makeSuccess(undefined);
  }
);
