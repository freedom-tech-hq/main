import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';

import { checkExistsAtPath } from './checkExistsAtPath.ts';

export const makeExistsFuncForFolderPath = (rootPath: string, ids: readonly SyncableId[]) =>
  makeAsyncResultFunc(
    [import.meta.filename],
    async (trace, id?: SyncableId): PR<boolean, 'wrong-type'> =>
      await checkExistsAtPath(trace, rootPath, id !== undefined ? [...ids, id] : ids)
  );
