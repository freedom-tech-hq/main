import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { SyncableId } from 'freedom-sync-types';
import { get } from 'lodash-es';

import type { FileSystemSyncableStoreBackingItem } from '../types/FileSystemSyncableStoreBackingItem.ts';
import { getFsPath } from './getFsPath.ts';
import { makeDataFuncForPath } from './makeDataFuncForPath.ts';
import { makeFileMetaFuncForPath } from './makeFileMetaFuncForPath.ts';
import { makeFolderMetaFuncForPath } from './makeFolderMetaFuncForPath.ts';

export const makeContentsFuncForPath = (rootPath: string, ids: readonly SyncableId[]) =>
  makeAsyncResultFunc(
    [import.meta.filename],
    async (trace): PR<Partial<Record<SyncableId, FileSystemSyncableStoreBackingItem>>, 'not-found' | 'wrong-type'> => {
      const dirPath = getFsPath(rootPath, ids);

      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        const result: Partial<Record<SyncableId, FileSystemSyncableStoreBackingItem>> = {};

        for (const entry of entries) {
          if (entry.name.startsWith('metadata.') && entry.name.endsWith('.json')) {
            continue; // Skip local-only files
          }

          const id = decodeURIComponent(entry.name) as SyncableId;

          if (entry.isFile()) {
            result[id] = {
              type: 'file',
              id,
              metadata: makeFileMetaFuncForPath(dirPath, [id]),
              data: makeDataFuncForPath(dirPath, [id])
            };
          } else if (entry.isDirectory()) {
            result[id] = {
              type: 'folder',
              id,
              metadata: makeFolderMetaFuncForPath(dirPath, [id]),
              contents: makeContentsFuncForPath(dirPath, [id])
            };
          }
        }

        return makeSuccess(result);
      } catch (e) {
        if (get(e, 'code') === 'ENOENT') {
          return makeFailure(new NotFoundError(trace, { message: `No folder found at ${dirPath}`, errorCode: 'not-found' }));
        }

        return makeFailure(new GeneralError(trace, e));
      }
    }
  );
