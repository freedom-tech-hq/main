import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableFlatFileMetadata, SyncableId } from 'freedom-sync-types';

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
    metadata: SyncableFlatFileMetadata & FileSystemLocalItemMetadata
  ): PR<undefined> => {
    const filePath = await getFsPath(trace, rootPath, ids);
    if (!filePath.ok) {
      return filePath;
    }

    await fs.writeFile(filePath.value, data);

    const savedMetadata = await createMetadataFile(trace, rootPath, ids, metadata);
    if (!savedMetadata.ok) {
      return savedMetadata;
    }

    return makeSuccess(undefined);
  }
);
