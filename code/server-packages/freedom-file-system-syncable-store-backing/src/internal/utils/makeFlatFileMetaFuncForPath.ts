import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import { type SyncableId, type SyncableItemMetadata } from 'freedom-sync-types';
import type { LocalItemMetadata } from 'freedom-syncable-store-types';
import type { JsonValue } from 'yaschema';

import { flatFileMetadataSchema } from '../types/FlatFileMetadata.ts';
import { getFsPath } from './getFsPath.ts';

export const makeFlatFileMetaFuncForPath = (rootPath: string, ids: readonly SyncableId[]) =>
  makeAsyncResultFunc(
    [import.meta.filename],
    async (trace): PR<SyncableItemMetadata & { type: 'flatFile' } & LocalItemMetadata, 'not-found' | 'wrong-type'> => {
      const filePath = await getFsPath(trace, rootPath, ids, ['metadata.json']);
      if (!filePath.ok) {
        return filePath;
      }

      const metadataJsonString = await fs.readFile(filePath.value, 'utf8');
      try {
        const metadataJson = JSON.parse(metadataJsonString) as JsonValue;
        const deserialization = await flatFileMetadataSchema.deserializeAsync(metadataJson, { validation: 'hard' });
        if (deserialization.error !== undefined) {
          return makeFailure(new InternalSchemaValidationError(trace, { message: deserialization.error }));
        }

        return makeSuccess(deserialization.deserialized);
      } catch (e) {
        return makeFailure(new GeneralError(trace, e));
      }
    }
  );
