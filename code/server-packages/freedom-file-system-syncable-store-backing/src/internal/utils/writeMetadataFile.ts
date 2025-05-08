import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { serialize, stringify } from 'freedom-serialization';
import type { SyncableStoreBackingItemMetadata } from 'freedom-syncable-store-backing-types';
import { syncableStoreBackingItemMetadataSchema } from 'freedom-syncable-store-backing-types';

import { writeFile } from './writeFile.ts';

export const writeMetadataFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, filePath: string, metadata: SyncableStoreBackingItemMetadata): PR<undefined> => {
    const serialization = await serialize(trace, metadata, syncableStoreBackingItemMetadataSchema);
    if (!serialization.ok) {
      return serialization;
    }

    const jsonString = await stringify(trace, metadata, syncableStoreBackingItemMetadataSchema);
    if (!jsonString.ok) {
      return jsonString;
    }

    return await writeFile(trace, filePath, jsonString.value);
  }
);
