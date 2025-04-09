import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { deserialize, serialize } from 'freedom-serialization';
import type { SyncablePath } from 'freedom-sync-types';
import type { JsonValue } from 'yaschema';

import type { OpfsChangeableLocalItemMetadata } from '../types/OpfsLocalItemMetadata.ts';
import { storedMetadataSchema } from '../types/StoredMetadata.ts';
import { getDirectoryHandleAndFilenameForMetadataFile } from './getDirectoryHandleAndFilenameForMetadataFile.ts';
import { readTextFile } from './readTextFile.ts';
import { writeTextFile } from './writeTextFile.ts';

export const updateLocalMetadata = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootHandle: FileSystemDirectoryHandle,
    path: SyncablePath,
    metadataChanges: Partial<OpfsChangeableLocalItemMetadata>
  ): PR<undefined> => {
    const dirAndFilename = await getDirectoryHandleAndFilenameForMetadataFile(trace, rootHandle, path);
    if (!dirAndFilename.ok) {
      return dirAndFilename;
    }

    const { dir, filename, metaFileLockKey } = dirAndFilename.value;

    const fileHandle = await dir.getFileHandle(filename);
    const metadataJsonString = await readTextFile(trace, fileHandle, { lockKey: metaFileLockKey });
    if (!metadataJsonString.ok) {
      return generalizeFailureResult(trace, metadataJsonString, 'format-error');
    }
    try {
      const metadataJson = JSON.parse(metadataJsonString.value) as JsonValue;
      const deserialization = await deserialize(trace, { serializedValue: metadataJson, valueSchema: storedMetadataSchema });
      if (!deserialization.ok) {
        return deserialization;
      }

      const metadata = deserialization.value;

      if ('hash' in metadataChanges) {
        metadata.hash = metadataChanges.hash;

        const serialization = await serialize(trace, metadata, storedMetadataSchema);
        if (!serialization.ok) {
          return serialization;
        }

        const outMetadataJsonString = JSON.stringify(serialization.value.serializedValue);
        const wrote = await writeTextFile(trace, fileHandle, { lockKey: metaFileLockKey, stringValue: outMetadataJsonString });
        if (!wrote.ok) {
          return wrote;
        }
      }

      return makeSuccess(undefined);
    } catch (e) {
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
