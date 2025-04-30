import { extractSyncableItemTypeFromId, type SyncableId } from 'freedom-sync-types';

import type { FileSystemSyncableStoreBackingItem } from '../types/FileSystemSyncableStoreBackingItem.ts';
import { makeContentsFuncForPath } from './makeContentsFuncForPath.ts';
import { makeDataFuncForPath } from './makeDataFuncForPath.ts';
import { makeExistsFuncForFilePath } from './makeExistsFuncForFilePath.ts';
import { makeExistsFuncForFolderPath } from './makeExistsFuncForFolderPath.ts';
import { makeFileMetaFuncForPath } from './makeFileMetaFuncForPath.ts';
import { makeFolderMetaFuncForPath } from './makeFolderMetaFuncForPath.ts';
import { makeGetFuncForPath } from './makeGetFuncForPath.ts';

export const getBackingItem = (rootPath: string, ids: readonly SyncableId[]): FileSystemSyncableStoreBackingItem => {
  const lastId = ids[ids.length - 1];
  const itemType = extractSyncableItemTypeFromId(lastId);

  switch (itemType) {
    case 'file':
      return {
        type: 'file',
        id: lastId,
        exists: makeExistsFuncForFilePath(rootPath, ids),
        metadata: makeFileMetaFuncForPath(rootPath, ids),
        data: makeDataFuncForPath(rootPath, ids)
      };
    case 'bundle':
    case 'folder':
      return {
        type: 'folder',
        id: lastId,
        exists: makeExistsFuncForFolderPath(rootPath, ids),
        get: makeGetFuncForPath(rootPath, ids),
        metadata: makeFolderMetaFuncForPath(rootPath, ids),
        contents: makeContentsFuncForPath(rootPath, ids)
      };
  }
};
