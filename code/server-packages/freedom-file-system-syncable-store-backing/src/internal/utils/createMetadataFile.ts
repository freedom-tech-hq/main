import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { SyncableId } from 'freedom-sync-types';

import { type AnyMetadata, anyMetadataSchema } from '../types/AnyMetadata.ts';
import type { FileSystemLocalItemMetadata } from '../types/FileSystemLocalItemMetadata.ts';
import { getFsPathForMetadataFile } from './getFsPathForMetadataFile.ts';

export const createMetadataFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, rootPath: string, ids: readonly SyncableId[], metadata: AnyMetadata & FileSystemLocalItemMetadata): PR<undefined> => {
    const filePath = await getFsPathForMetadataFile(trace, rootPath, ids);
    if (!filePath.ok) {
      return filePath;
    }

    const serialization = await anyMetadataSchema.serializeAsync(metadata, { validation: 'hard' });
    if (serialization.error !== undefined) {
      return makeFailure(new InternalSchemaValidationError(trace, { message: serialization.error }));
    }

    const outMetadataJsonString = JSON.stringify(serialization.serialized);
    await fs.writeFile(filePath.value, outMetadataJsonString, 'utf-8');

    return makeSuccess(undefined);
  }
);
