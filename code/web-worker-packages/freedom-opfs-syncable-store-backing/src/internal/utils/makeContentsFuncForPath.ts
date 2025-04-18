import type { PR } from 'freedom-async';
import { log, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableId, SyncablePath } from 'freedom-sync-types';
import { extractSyncableIdParts } from 'freedom-sync-types';

import type { OpfsSyncableStoreBackingItem } from '../types/OpfsSyncableStoreBackingItem.ts';
import { getDirectoryHandle } from './getDirectoryHandle.ts';
import { ls } from './ls.ts';
import { makeDataFuncForPath } from './makeDataFuncForPath.ts';
import { makeFileMetaFuncForPath } from './makeFileMetaFuncForPath.ts';
import { makeFolderMetaFuncForPath } from './makeFolderMetaFuncForPath.ts';

export const makeContentsFuncForPath = (rootHandle: FileSystemDirectoryHandle, path: SyncablePath) =>
  makeAsyncResultFunc(
    [import.meta.filename],
    async (trace): PR<Partial<Record<SyncableId, OpfsSyncableStoreBackingItem>>, 'not-found' | 'wrong-type'> => {
      const dir = await getDirectoryHandle(trace, rootHandle, path);
      if (!dir.ok) {
        return dir;
      }

      const entries = await ls(trace, dir.value);
      if (!entries.ok) {
        return entries;
      }

      const result: Partial<Record<SyncableId, OpfsSyncableStoreBackingItem>> = {};

      for (const entry of entries.value) {
        if (entry.endsWith('.crswap')) {
          continue; // Skip temporary swap files, which are generated by the browser itself
        } else if (entry.startsWith('metadata.') && entry.endsWith('.json')) {
          continue; // Skip local-only files
        }

        const id = decodeURIComponent(entry) as SyncableId;
        const subPath = path.append(id);
        try {
          const idParts = extractSyncableIdParts(id);

          if (idParts.type === 'file') {
            result[id] = {
              type: 'file',
              id,
              metadata: makeFileMetaFuncForPath(rootHandle, subPath),
              data: makeDataFuncForPath(rootHandle, subPath)
            };
          } else {
            result[id] = {
              type: 'folder',
              id,
              metadata: makeFolderMetaFuncForPath(rootHandle, subPath),
              contents: makeContentsFuncForPath(rootHandle, subPath)
            };
          }
        } catch (e) {
          log().debug?.(`Error while processing: ${entry}`, e);
        }
      }

      return makeSuccess(result);
    }
  );
