import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { SyncableId } from 'freedom-sync-types';
import { get } from 'lodash-es';

import type { FileSystemSyncableStoreBackingItem } from '../types/FileSystemSyncableStoreBackingItem.ts';
import { getFsPath } from './getFsPath.ts';
import { makeDataFuncForPath } from './makeDataFuncForPath.ts';
import { makeFlatFileMetaFuncForPath } from './makeFlatFileMetaFuncForPath.ts';
import { makeFolderMetaFuncForPath } from './makeFolderMetaFuncForPath.ts';

export const makeContentsFuncForPath = (rootPath: string, ids: readonly SyncableId[]) =>
  makeAsyncResultFunc(
    [import.meta.filename],
    async (trace): PR<Partial<Record<SyncableId, FileSystemSyncableStoreBackingItem>>, 'not-found' | 'wrong-type'> => {
      const dirPath = await getFsPath(trace, rootPath, ids);
      if (!dirPath.ok) {
        return dirPath;
      }

      try {
        const entries = await fs.readdir(dirPath.value, { withFileTypes: true });

        const result: Partial<Record<SyncableId, FileSystemSyncableStoreBackingItem>> = {};

        for (const entry of entries) {
          const id = entry.name as SyncableId;

          if (entry.isFile()) {
            result[id] = {
              type: 'flatFile',
              id,
              metadata: makeFlatFileMetaFuncForPath(dirPath.value, [id]),
              data: makeDataFuncForPath(dirPath.value, [id])
            };
          } else if (entry.isDirectory()) {
            result[id] = {
              type: 'folder',
              id,
              metadata: makeFolderMetaFuncForPath(dirPath.value, [id]),
              contents: makeContentsFuncForPath(dirPath.value, [id])
            };
          }
        }

        return makeSuccess(result);
      } catch (e) {
        if (get(e, 'code') === 'ENOENT') {
          return makeFailure(new NotFoundError(trace, { message: `No folder found at ${dirPath.value}`, errorCode: 'not-found' }));
        }

        return makeFailure(new GeneralError(trace, e));
      }
    }
  );
