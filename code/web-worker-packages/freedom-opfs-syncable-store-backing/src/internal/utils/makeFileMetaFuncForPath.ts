import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { deserialize } from 'freedom-serialization';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStoreBackingItemMetadata } from 'freedom-syncable-store-backing-types';
import { syncableStoreBackingItemMetadataSchema } from 'freedom-syncable-store-backing-types';
import type { JsonValue } from 'yaschema';

import { getDirectoryHandleAndFilenameForMetadataFile } from './getDirectoryHandleAndFilenameForMetadataFile.ts';
import { getFileHandleForDirectoryHandleAndFilename } from './getFileHandleForDirectoryHandleAndFilename.ts';
import { readTextFile } from './readTextFile.ts';

export const makeFileMetaFuncForPath = (rootHandle: FileSystemDirectoryHandle, path: SyncablePath) =>
  makeAsyncResultFunc([import.meta.filename], async (trace): PR<SyncableStoreBackingItemMetadata, 'not-found' | 'wrong-type'> => {
    const dirAndFilename = await getDirectoryHandleAndFilenameForMetadataFile(trace, rootHandle, path);
    if (!dirAndFilename.ok) {
      return dirAndFilename;
    }

    const { dir, filename, metaFileLockKey } = dirAndFilename.value;

    const fileHandle = await getFileHandleForDirectoryHandleAndFilename(trace, dir, filename);
    if (!fileHandle.ok) {
      return fileHandle;
    }

    const metadataJsonString = await readTextFile(trace, fileHandle.value, { lockKey: metaFileLockKey });
    if (!metadataJsonString.ok) {
      return generalizeFailureResult(trace, metadataJsonString, 'format-error');
    }

    try {
      const metadataJson = JSON.parse(metadataJsonString.value) as JsonValue;
      const deserialization = await deserialize(trace, {
        serializedValue: metadataJson,
        valueSchema: syncableStoreBackingItemMetadataSchema
      });
      if (!deserialization.ok) {
        return deserialization;
      }

      return makeSuccess(deserialization.value);
    } catch (e) {
      return makeFailure(new GeneralError(trace, e));
    }
  });
