import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { extractSyncableItemTypeFromId, type SyncableId, type SyncablePath } from 'freedom-sync-types';

import { getDirectoryHandle } from './getDirectoryHandle.ts';
import { getFileHandleForSyncablePath } from './getFileHandleForSyncablePath.ts';

export const makeExistsFuncForFolderPath = (rootHandle: FileSystemDirectoryHandle, path: SyncablePath) =>
  makeAsyncResultFunc([import.meta.filename], async (trace, id?: SyncableId): PR<boolean, 'wrong-type'> => {
    const dir = await getDirectoryHandle(trace, rootHandle, path);
    if (!dir.ok) {
      if (dir.value.errorCode === 'not-found') {
        return makeSuccess(false);
      }
      return excludeFailureResult(dir, 'not-found');
    }

    if (id !== undefined) {
      const itemType = extractSyncableItemTypeFromId(id);
      switch (itemType) {
        case 'file': {
          const fileHandle = await getFileHandleForSyncablePath(trace, rootHandle, path.append(id));
          if (!fileHandle.ok) {
            if (fileHandle.value.errorCode === 'not-found') {
              return makeSuccess(false);
            }
            return excludeFailureResult(fileHandle, 'not-found');
          }

          return makeSuccess(true);
        }
        case 'bundle':
        case 'folder': {
          const dirHandle = await getDirectoryHandle(trace, rootHandle, path.append(id));
          if (!dirHandle.ok) {
            if (dirHandle.value.errorCode === 'not-found') {
              return makeSuccess(false);
            }
            return excludeFailureResult(dirHandle, 'not-found');
          }

          return makeSuccess(true);
        }
      }
    } else {
      return makeSuccess(true);
    }
  });
