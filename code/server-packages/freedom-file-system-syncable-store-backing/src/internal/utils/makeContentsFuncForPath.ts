import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { allResultsMapped, GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import type { SyncableId } from 'freedom-sync-types';
import { get } from 'lodash-es';

import type { FileSystemSyncableStoreBackingItem } from '../types/FileSystemSyncableStoreBackingItem.ts';
import { getFsPath } from './getFsPath.ts';
import { makeDataFuncForPath } from './makeDataFuncForPath.ts';
import { makeFileMetaFuncForPath } from './makeFileMetaFuncForPath.ts';
import { makeFolderMetaFuncForPath } from './makeFolderMetaFuncForPath.ts';
import { readLocalMetadata } from './readLocalMetadata.ts';

export const makeContentsFuncForPath = (rootPath: string, ids: readonly SyncableId[]) =>
  makeAsyncResultFunc(
    [import.meta.filename],
    async (trace): PR<Partial<Record<SyncableId, FileSystemSyncableStoreBackingItem>>, 'not-found' | 'wrong-type'> => {
      const dirPath = getFsPath(rootPath, ids);

      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        const result: Partial<Record<SyncableId, FileSystemSyncableStoreBackingItem>> = {};

        const processedEntries = await allResultsMapped(trace, entries, {}, async (trace, entry) => {
          if (entry.name.startsWith('metadata.') && entry.name.endsWith('.json')) {
            return makeSuccess(undefined); // Skip local-only files
          }

          const fsPath = getFsPath(rootPath, ids, { suffixPaths: [`metadata.${entry.name}`], extension: 'json' });

          const localMetadata = await readLocalMetadata(trace, fsPath);
          if (!localMetadata.ok) {
            return localMetadata;
          }

          const id = localMetadata.value.id;

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

          return makeSuccess(undefined);
        });
        if (!processedEntries.ok) {
          return processedEntries;
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
