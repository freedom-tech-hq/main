import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableBundleMetadata, SyncableFolderMetadata, SyncableId } from 'freedom-sync-types';

import type { FileSystemLocalItemMetadata } from '../types/FileSystemLocalItemMetadata.ts';
import { createMetadataFile } from './createMetadataFile.ts';
import { getFsPath } from './getFsPath.ts';

export const createFolder = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootPath: string,
    ids: readonly SyncableId[],
    metadata: (SyncableBundleMetadata | SyncableFolderMetadata) & FileSystemLocalItemMetadata
  ): PR<undefined> => {
    const dirPath = await getFsPath(trace, rootPath, ids);
    if (!dirPath.ok) {
      return dirPath;
    }

    await fs.mkdir(dirPath.value);

    const savedMetadata = await createMetadataFile(trace, rootPath, ids, metadata);
    if (!savedMetadata.ok) {
      return savedMetadata;
    }

    return makeSuccess(undefined);
  }
);
