import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { deserialize } from 'freedom-serialization';
import type { JsonValue } from 'yaschema';

import type { FileSystemLocalItemMetadata } from '../types/FileSystemLocalItemMetadata.ts';
import { storedMetadataSchema } from '../types/StoredMetadata.ts';

export const readLocalMetadata = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, path: string): PR<FileSystemLocalItemMetadata> => {
    const metadataJsonString = await fs.readFile(path, 'utf-8');
    try {
      const metadataJson = JSON.parse(metadataJsonString) as JsonValue;
      const deserialization = await deserialize(trace, { serializedValue: metadataJson, valueSchema: storedMetadataSchema });
      if (!deserialization.ok) {
        return deserialization;
      }

      const metadata = deserialization.value;
      return makeSuccess(metadata);
    } catch (e) {
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
