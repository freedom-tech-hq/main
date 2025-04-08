import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { deserialize } from 'freedom-serialization';
import { type SyncableId, type SyncableItemMetadata } from 'freedom-sync-types';
import type { JsonValue } from 'yaschema';

import type { OpfsLocalItemMetadata } from '../types/OpfsLocalItemMetadata.ts';
import { storedMetadataSchema } from '../types/StoredMetadata.ts';
import { getDirectoryHandleAndFilenameForMetadataFile } from './getDirectoryHandleAndFilenameForMetadataFile.ts';

export const makeFileMetaFuncForPath = (rootHandle: FileSystemDirectoryHandle, ids: readonly SyncableId[]) =>
  makeAsyncResultFunc(
    [import.meta.filename],
    async (trace): PR<SyncableItemMetadata & OpfsLocalItemMetadata, 'not-found' | 'wrong-type'> => {
      const filePath = getDirectoryHandleAndFilenameForMetadataFile(rootPath, ids);

      const metadataJsonString = await fs.readFile(filePath, 'utf8');
      try {
        const metadataJson = JSON.parse(metadataJsonString) as JsonValue;
        const deserialization = await deserialize(trace, { serializedValue: metadataJson, valueSchema: storedMetadataSchema });
        if (!deserialization.ok) {
          return deserialization;
        }

        return makeSuccess(deserialization.value);
      } catch (e) {
        return makeFailure(new GeneralError(trace, e));
      }
    }
  );
