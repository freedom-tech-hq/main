import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { SyncableId } from 'freedom-sync-types';
import type { LocalItemMetadata } from 'freedom-syncable-store-types';
import type { JsonValue } from 'yaschema';

import { anyMetadataSchema } from '../types/AnyMetadata.ts';
import { getFsPath } from './getFsPath.ts';

export const updateLocalMetadata = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, rootPath: string, ids: readonly SyncableId[], metadataChanges: Partial<LocalItemMetadata>): PR<undefined> => {
    const filePath = await getFsPath(trace, rootPath, ids, ['metadata.json']);
    if (!filePath.ok) {
      return filePath;
    }

    const metadataJsonString = await fs.readFile(filePath.value, 'utf-8');
    try {
      const metadataJson = JSON.parse(metadataJsonString) as JsonValue;
      const deserialization = await anyMetadataSchema.deserializeAsync(metadataJson, { validation: 'hard' });
      if (deserialization.error !== undefined) {
        return makeFailure(new InternalSchemaValidationError(trace, { message: deserialization.error }));
      }

      const metadata = deserialization.deserialized;

      if ('hash' in metadataChanges) {
        metadata.hash = metadataChanges.hash;

        const serialization = await anyMetadataSchema.serializeAsync(metadata, { validation: 'hard' });
        if (serialization.error !== undefined) {
          return makeFailure(new InternalSchemaValidationError(trace, { message: serialization.error }));
        }

        const outMetadataJsonString = JSON.stringify(serialization.serialized);
        await fs.writeFile(filePath.value, outMetadataJsonString, 'utf-8');
      }

      return makeSuccess(undefined);
    } catch (e) {
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
