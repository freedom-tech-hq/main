import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { deserialize, serialize } from 'freedom-serialization';
import type { LocalItemMetadata, SyncablePath } from 'freedom-sync-types';
import { syncableStoreBackingItemMetadataSchema } from 'freedom-syncable-store-backing-types';
import { merge } from 'lodash-es';
import type { JsonValue } from 'yaschema';

import { getDirectoryHandleAndFilenameForMetadataFile } from './getDirectoryHandleAndFilenameForMetadataFile.ts';
import { getFileHandleForDirectoryHandleAndFilename } from './getFileHandleForDirectoryHandleAndFilename.ts';
import { readTextFile } from './readTextFile.ts';
import { writeTextFile } from './writeTextFile.ts';

export const updateLocalMetadata = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootHandle: FileSystemDirectoryHandle,
    path: SyncablePath,
    metadataChanges: Partial<LocalItemMetadata>
  ): PR<undefined, 'not-found'> => {
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

      const metadata = deserialization.value;

      merge(metadata, metadataChanges);

      const serialization = await serialize(trace, metadata, syncableStoreBackingItemMetadataSchema);
      if (!serialization.ok) {
        return serialization;
      }

      const outMetadataJsonString = JSON.stringify(serialization.value.serializedValue);
      const wrote = await writeTextFile(trace, fileHandle.value, { lockKey: metaFileLockKey, stringValue: outMetadataJsonString });
      if (!wrote.ok) {
        return wrote;
      }

      return makeSuccess(undefined);
    } catch (e) {
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
