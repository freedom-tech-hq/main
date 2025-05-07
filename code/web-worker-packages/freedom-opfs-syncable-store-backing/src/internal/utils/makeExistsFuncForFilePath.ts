import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { type SyncablePath } from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { getFileHandleForSyncablePath } from './getFileHandleForSyncablePath.ts';

export const makeExistsFuncForFilePath = (rootHandle: FileSystemDirectoryHandle, path: SyncablePath) =>
  makeAsyncResultFunc([import.meta.filename], async (trace): PR<boolean, 'wrong-type'> => {
    const fileHandle = await disableLam('not-found', getFileHandleForSyncablePath)(trace, rootHandle, path);
    if (!fileHandle.ok) {
      if (fileHandle.value.errorCode === 'not-found') {
        return makeSuccess(false);
      }
      return excludeFailureResult(fileHandle, 'not-found');
    }

    return makeSuccess(true);
  });
