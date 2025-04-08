import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { deserialize, serialize } from 'freedom-serialization';
import type { SyncableId } from 'freedom-sync-types';
import type { JsonValue } from 'yaschema';

import type { OpfsChangeableLocalItemMetadata } from '../types/OpfsLocalItemMetadata.ts';
import { storedMetadataSchema } from '../types/StoredMetadata.ts';
import { getDirectoryHandleAndFilenameForMetadataFile } from './getDirectoryHandleAndFilenameForMetadataFile.ts';

export const updateLocalMetadata = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootHandle: FileSystemDirectoryHandle,
    ids: readonly SyncableId[],
    metadataChanges: Partial<OpfsChangeableLocalItemMetadata>
  ): PR<undefined> => {
    const filePath = getDirectoryHandleAndFilenameForMetadataFile(rootPath, ids);

    const metadataJsonString = await fs.readFile(filePath, 'utf-8');
    try {
      const metadataJson = JSON.parse(metadataJsonString) as JsonValue;
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
        await fs.writeFile(filePath, outMetadataJsonString, 'utf-8');
      }

      return makeSuccess(undefined);
    } catch (e) {
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
