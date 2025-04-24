import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';

import type { FileSystemLocalItemMetadata } from '../types/FileSystemLocalItemMetadata.ts';
import { createMetadataFile } from './createMetadataFile.ts';
import { getFsPath } from './getFsPath.ts';
import { writeFile } from './writeFile.ts';

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

    const wrote = await writeFile(trace, filePath, data);
    if (!wrote.ok) {
      return wrote;
    }

    const savedMetadata = await createMetadataFile(trace, rootPath, ids, metadata);
    if (!savedMetadata.ok) {
      return savedMetadata;
    }

    return makeSuccess(undefined);
  }
);
