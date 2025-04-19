import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';

import type { FileSystemLocalItemMetadata } from '../types/FileSystemLocalItemMetadata.ts';
import { createMetadataFile } from './createMetadataFile.ts';
import { getFsPath } from './getFsPath.ts';

export const createFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootPath: string,
    ids: readonly SyncableId[],
    data: Uint8Array,
    metadata: SyncableItemMetadata & FileSystemLocalItemMetadata
  ): PR<undefined> => {
    const filePath = getFsPath(rootPath, ids);

    await fs.writeFile(filePath, data);
    // console.log(`  CF>   ${decodeURIComponent(filePath.substring(rootPath.length))}`);

    const savedMetadata = await createMetadataFile(trace, rootPath, ids, metadata);
    if (!savedMetadata.ok) {
      return savedMetadata;
    }

    return makeSuccess(undefined);
  }
);
