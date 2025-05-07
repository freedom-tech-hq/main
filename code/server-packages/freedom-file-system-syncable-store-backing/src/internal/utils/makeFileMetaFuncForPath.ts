import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { type SyncableId } from 'freedom-sync-types';
import type { SyncableStoreBackingItemMetadata } from 'freedom-syncable-store-backing-types';

import { getFsPathForMetadataFile } from './getFsPathForMetadataFile.ts';
import { readMetadataFile } from './readMetadataFile.ts';

export const makeFileMetaFuncForPath = (rootPath: string, ids: readonly SyncableId[]) =>
  makeAsyncResultFunc([import.meta.filename], async (trace): PR<SyncableStoreBackingItemMetadata, 'not-found' | 'wrong-type'> => {
    const filePath = getFsPathForMetadataFile(rootPath, ids);

    return await readMetadataFile(trace, filePath);
  });
