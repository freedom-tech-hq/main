import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { SyncableId } from 'freedom-sync-types';
import type { JsonValue } from 'yaschema';

import { anyMetadataSchema } from '../types/AnyMetadata.ts';
import type { FileSystemChangeableLocalItemMetadata } from '../types/FileSystemLocalItemMetadata.ts';
import { getFsPathForMetadataFile } from './getFsPathForMetadataFile.ts';

export const updateLocalMetadata = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootPath: string,
    ids: readonly SyncableId[],
    metadataChanges: Partial<FileSystemChangeableLocalItemMetadata>
  ): PR<undefined> => {
    const filePath = getFsPathForMetadataFile(rootPath, ids);

    const metadataJsonString = await fs.readFile(filePath, 'utf-8');
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
        await fs.writeFile(filePath, outMetadataJsonString, 'utf-8');
      }

      return makeSuccess(undefined);
    } catch (e) {
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
