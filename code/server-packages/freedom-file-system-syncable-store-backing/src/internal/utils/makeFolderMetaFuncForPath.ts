import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncableId, SyncableItemMetadata } from 'freedom-sync-types';

import type { FileSystemLocalItemMetadata } from '../types/FileSystemLocalItemMetadata.ts';
import { getFsPathForMetadataFile } from './getFsPathForMetadataFile.ts';
import { readMetadataFile } from './readMetadataFile.ts';

export const makeFolderMetaFuncForPath = (rootPath: string, ids: readonly SyncableId[]) =>
  makeAsyncResultFunc(
    [import.meta.filename],
    async (trace): PR<SyncableItemMetadata & FileSystemLocalItemMetadata, 'not-found' | 'wrong-type'> => {
      const filePath = getFsPathForMetadataFile(rootPath, ids);

      return await readMetadataFile(trace, filePath);
    }
  );
