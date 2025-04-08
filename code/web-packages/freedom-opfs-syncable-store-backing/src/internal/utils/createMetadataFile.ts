import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { serialize } from 'freedom-serialization';
import type { SyncableId } from 'freedom-sync-types';

import type { OpfsLocalItemMetadata } from '../types/OpfsLocalItemMetadata.ts';
import { type StoredMetadata, storedMetadataSchema } from '../types/StoredMetadata.ts';
import { getDirectoryHandleAndFilenameForMetadataFile } from './getDirectoryHandleAndFilenameForMetadataFile.ts';

export const createMetadataFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootHandle: FileSystemDirectoryHandle,
    ids: readonly SyncableId[],
    metadata: StoredMetadata & OpfsLocalItemMetadata
  ): PR<undefined> => {
    const { dir, filename } = await getDirectoryHandleAndFilenameForMetadataFile(rootHandle, ids);

    const serialization = await serialize(trace, metadata, storedMetadataSchema);
    if (!serialization.ok) {
      return serialization;
    }

    const outMetadataJsonString = JSON.stringify(serialization.value.serializedValue);
    const fileHandle = await dir.getFileHandle(filename, { create: true });
    const writeStream = await fileHandle.createWritable();
    await writeStream.write(outMetadataJsonString);

    return makeSuccess(undefined);
  }
);
