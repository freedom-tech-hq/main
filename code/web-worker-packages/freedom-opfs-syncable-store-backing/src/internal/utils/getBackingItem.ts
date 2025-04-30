import { extractSyncableIdParts, type SyncableId, type SyncablePath } from 'freedom-sync-types';

import type { OpfsSyncableStoreBackingItem } from '../types/OpfsSyncableStoreBackingItem.ts';
import { makeContentsFuncForPath } from './makeContentsFuncForPath.ts';
import { makeDataFuncForPath } from './makeDataFuncForPath.ts';
import { makeExistsFuncForFilePath } from './makeExistsFuncForFilePath.ts';
import { makeExistsFuncForFolderPath } from './makeExistsFuncForFolderPath.ts';
import { makeFileMetaFuncForPath } from './makeFileMetaFuncForPath.ts';
import { makeFolderMetaFuncForPath } from './makeFolderMetaFuncForPath.ts';
import { makeGetFuncForPath } from './makeGetFuncForPath.ts';

export const getBackingItem = (rootHandle: FileSystemDirectoryHandle, path: SyncablePath, id: SyncableId): OpfsSyncableStoreBackingItem => {
  const subPath = path.append(id);
  const idParts = extractSyncableIdParts(id);

  if (idParts.type === 'file') {
    return {
      type: 'file',
      id,
      exists: makeExistsFuncForFilePath(rootHandle, subPath),
      metadata: makeFileMetaFuncForPath(rootHandle, subPath),
      data: makeDataFuncForPath(rootHandle, subPath)
    };
  } else {
    return {
      type: 'folder',
      id,
      exists: makeExistsFuncForFolderPath(rootHandle, subPath),
      get: makeGetFuncForPath(rootHandle, subPath),
      metadata: makeFolderMetaFuncForPath(rootHandle, subPath),
      contents: makeContentsFuncForPath(rootHandle, subPath)
    };
  }
};
