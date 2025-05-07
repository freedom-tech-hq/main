import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';
import type { SyncableStoreBackingItemMetadata } from 'freedom-syncable-store-backing-types';

import { createMetadataFile } from './createMetadataFile.ts';
import { getFsPath } from './getFsPath.ts';

export const createFolder = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, rootPath: string, ids: readonly SyncableId[], metadata: SyncableStoreBackingItemMetadata): PR<undefined> => {
    const dirPath = getFsPath(rootPath, ids);

    await fs.mkdir(dirPath);

    const savedMetadata = await createMetadataFile(trace, rootPath, ids, metadata);
    if (!savedMetadata.ok) {
      return savedMetadata;
    }

    return makeSuccess(undefined);
  }
);
