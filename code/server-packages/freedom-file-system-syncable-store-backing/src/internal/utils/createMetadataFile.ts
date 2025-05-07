import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { serialize } from 'freedom-serialization';
import type { SyncableId } from 'freedom-sync-types';
import { type SyncableStoreBackingItemMetadata, syncableStoreBackingItemMetadataSchema } from 'freedom-syncable-store-backing-types';

import { getFsPathForMetadataFile } from './getFsPathForMetadataFile.ts';
import { writeFile } from './writeFile.ts';

export const createMetadataFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, rootPath: string, ids: readonly SyncableId[], metadata: SyncableStoreBackingItemMetadata): PR<undefined> => {
    const filePath = getFsPathForMetadataFile(rootPath, ids);

    const serialization = await serialize(trace, metadata, syncableStoreBackingItemMetadataSchema);
    if (!serialization.ok) {
      return serialization;
    }

    const outMetadataJsonString = JSON.stringify(serialization.value.serializedValue);
    const wrote = await writeFile(trace, filePath, outMetadataJsonString);
    if (!wrote.ok) {
      return wrote;
    }

    return makeSuccess(undefined);
  }
);
