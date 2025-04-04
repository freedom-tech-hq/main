import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';
import type { JsonValue } from 'yaschema';

import type { FileSystemLocalItemMetadata } from '../types/FileSystemLocalItemMetadata.ts';
import { storedMetadataSchema } from '../types/StoredMetadata.ts';
import { getFsPathForMetadataFile } from './getFsPathForMetadataFile.ts';

export const makeFolderMetaFuncForPath = (rootPath: string, ids: readonly SyncableId[]) =>
  makeAsyncResultFunc(
    [import.meta.filename],
    async (trace): PR<SyncableItemMetadata & FileSystemLocalItemMetadata, 'not-found' | 'wrong-type'> => {
      const filePath = getFsPathForMetadataFile(rootPath, ids);

      const metadataJsonString = await fs.readFile(filePath, 'utf8');
      try {
        const metadataJson = JSON.parse(metadataJsonString) as JsonValue;
        const deserialization = await storedMetadataSchema.deserializeAsync(metadataJson, { validation: 'hard' });
        if (deserialization.error !== undefined) {
          return makeFailure(new InternalSchemaValidationError(trace, { message: deserialization.error }));
        }

        return makeSuccess(deserialization.deserialized);
      } catch (e) {
        return makeFailure(new GeneralError(trace, e));
      }
    }
  );
