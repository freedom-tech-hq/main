import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { parse } from 'freedom-serialization';
import { type SyncableStoreBackingItemMetadata, syncableStoreBackingItemMetadataSchema } from 'freedom-syncable-store-backing-types';

import { readStringFile } from './readStringFile.ts';

export const readMetadataFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, filePath: string): PR<SyncableStoreBackingItemMetadata, 'not-found' | 'wrong-type'> => {
    const metadataJsonString = await readStringFile(trace, filePath);
    if (!metadataJsonString.ok) {
      return metadataJsonString;
    }

    return await parse(trace, metadataJsonString.value, syncableStoreBackingItemMetadataSchema);
  }
);
