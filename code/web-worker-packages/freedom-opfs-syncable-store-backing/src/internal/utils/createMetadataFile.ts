import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { serialize } from 'freedom-serialization';
import type { SyncablePath } from 'freedom-sync-types';

import type { OpfsLocalItemMetadata } from '../types/OpfsLocalItemMetadata.ts';
import { type StoredMetadata, storedMetadataSchema } from '../types/StoredMetadata.ts';
import { getDirectoryHandleAndFilenameForMetadataFile } from './getDirectoryHandleAndFilenameForMetadataFile.ts';
import { getFileHandleForDirectoryHandleAndFilename } from './getFileHandleForDirectoryHandleAndFilename.ts';
import { writeTextFile } from './writeTextFile.ts';

export const createMetadataFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootHandle: FileSystemDirectoryHandle,
    path: SyncablePath,
    metadata: StoredMetadata & OpfsLocalItemMetadata
  ): PR<undefined> => {
    const dirAndFilename = await getDirectoryHandleAndFilenameForMetadataFile(trace, rootHandle, path);
    if (!dirAndFilename.ok) {
      return dirAndFilename;
    }

    const { dir, filename, metaFileLockKey } = dirAndFilename.value;

    const serialization = await serialize(trace, metadata, storedMetadataSchema);
    if (!serialization.ok) {
      return serialization;
    }

    const outMetadataJsonString = JSON.stringify(serialization.value.serializedValue);

    const fileHandle = await getFileHandleForDirectoryHandleAndFilename(trace, dir, filename, { create: true });
    if (!fileHandle.ok) {
      return generalizeFailureResult(trace, fileHandle, 'not-found');
    }

    return await writeTextFile(trace, fileHandle.value, { lockKey: metaFileLockKey, stringValue: outMetadataJsonString });
  }
);
