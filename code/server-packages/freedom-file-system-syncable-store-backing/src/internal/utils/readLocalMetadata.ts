import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { JsonValue } from 'yaschema';

import type { FileSystemLocalItemMetadata } from '../types/FileSystemLocalItemMetadata.ts';
import { storedMetadataSchema } from '../types/StoredMetadata.ts';

export const readLocalMetadata = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, path: string): PR<FileSystemLocalItemMetadata> => {
    const metadataJsonString = await fs.readFile(path, 'utf-8');
    try {
      const metadataJson = JSON.parse(metadataJsonString) as JsonValue;
      const deserialization = await storedMetadataSchema.deserializeAsync(metadataJson, { validation: 'hard' });
      if (deserialization.error !== undefined) {
        return makeFailure(new InternalSchemaValidationError(trace, { message: deserialization.error }));
      }

      const metadata = deserialization.deserialized;
      return makeSuccess(metadata);
    } catch (e) {
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
