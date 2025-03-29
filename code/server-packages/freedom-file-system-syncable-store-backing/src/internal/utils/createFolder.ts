import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';

import type { FileSystemLocalItemMetadata } from '../types/FileSystemLocalItemMetadata.ts';
import { createMetadataFile } from './createMetadataFile.ts';
import { getFsPath } from './getFsPath.ts';

export const createFolder = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    rootPath: string,
    ids: readonly SyncableId[],
    metadata: SyncableItemMetadata & FileSystemLocalItemMetadata
  ): PR<undefined> => {
    const dirPath = getFsPath(rootPath, ids);

    await fs.mkdir(dirPath);

    const savedMetadata = await createMetadataFile(trace, rootPath, ids, metadata);
    if (!savedMetadata.ok) {
      return savedMetadata;
    }

    return makeSuccess(undefined);
  }
);
