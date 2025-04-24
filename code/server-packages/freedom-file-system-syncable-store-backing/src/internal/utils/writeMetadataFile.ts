import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { serialize, stringify } from 'freedom-serialization';
import type { SyncableItemMetadata } from 'freedom-sync-types';

import type { FileSystemLocalItemMetadata } from '../types/FileSystemLocalItemMetadata.ts';
import { storedMetadataSchema } from '../types/StoredMetadata.ts';
import { writeFile } from './writeFile.ts';

export const writeMetadataFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, filePath: string, metadata: SyncableItemMetadata & FileSystemLocalItemMetadata): PR<undefined> => {
    const serialization = await serialize(trace, metadata, storedMetadataSchema);
    if (!serialization.ok) {
      return serialization;
    }

    const jsonString = await stringify(trace, metadata, storedMetadataSchema);
    if (!jsonString.ok) {
      return jsonString;
    }

    return await writeFile(trace, filePath, jsonString.value);
  }
);
