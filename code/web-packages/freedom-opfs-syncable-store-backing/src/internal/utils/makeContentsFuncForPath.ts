import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { NotFoundError } from 'freedom-common-errors';
import { extractSyncableIdParts, type SyncableId } from 'freedom-sync-types';
import { get } from 'lodash-es';

import type { OpfsSyncableStoreBackingItem } from '../types/OpfsSyncableStoreBackingItem.ts';
import { getDirectoryHandle } from './getDirectoryHandle.ts';
import { ls } from './ls.ts';
import { makeDataFuncForPath } from './makeDataFuncForPath.ts';
import { makeFileMetaFuncForPath } from './makeFileMetaFuncForPath.ts';
import { makeFolderMetaFuncForPath } from './makeFolderMetaFuncForPath.ts';

export const makeContentsFuncForPath = (rootHandle: FileSystemDirectoryHandle, ids: readonly SyncableId[]) =>
  makeAsyncResultFunc(
    [import.meta.filename],
    async (trace): PR<Partial<Record<SyncableId, OpfsSyncableStoreBackingItem>>, 'not-found' | 'wrong-type'> => {
      const dir = await getDirectoryHandle(rootHandle, ids);

      try {
        const entries = await ls(dir);

        const result: Partial<Record<SyncableId, OpfsSyncableStoreBackingItem>> = {};

        for (const entry of entries) {
          if (entry.startsWith('metadata.') && entry.endsWith('.json')) {
            continue; // Skip local-only files
          }

          const id = decodeURIComponent(entry) as SyncableId;
          const idParts = extractSyncableIdParts(id);

          if (idParts.type === 'file') {
            result[id] = {
              type: 'file',
              id,
              metadata: makeFileMetaFuncForPath(dir, [id]),
              data: makeDataFuncForPath(dir, [id])
            };
          } else {
            result[id] = {
              type: 'folder',
              id,
              metadata: makeFolderMetaFuncForPath(dir, [id]),
              contents: makeContentsFuncForPath(dir, [id])
            };
          }
        }

        return makeSuccess(result);
      } catch (e) {
        if (get(e, 'code') === 'ENOENT') {
          return makeFailure(new NotFoundError(trace, { message: `No folder found at ${ids.join('/')}`, errorCode: 'not-found' }));
        }

        return makeFailure(new GeneralError(trace, e));
      }
    }
  );
