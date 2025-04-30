import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';

import { checkExistsAtPath } from './checkExistsAtPath.ts';

export const makeExistsFuncForFilePath = (rootPath: string, ids: readonly SyncableId[]) =>
  makeAsyncResultFunc([import.meta.filename], async (trace): PR<boolean, 'wrong-type'> => await checkExistsAtPath(trace, rootPath, ids));
