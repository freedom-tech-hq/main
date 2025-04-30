import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableId } from 'freedom-sync-types';

import type { FileSystemSyncableStoreBackingItem } from '../types/FileSystemSyncableStoreBackingItem.ts';
import { getBackingItem } from './getItemInPathWithId.ts';

export const makeGetFuncForPath = (rootPath: string, ids: readonly SyncableId[]) =>
  makeAsyncResultFunc(
    [import.meta.filename],
    async (_trace, id: SyncableId): PR<FileSystemSyncableStoreBackingItem, 'not-found' | 'wrong-type'> =>
      makeSuccess(getBackingItem(rootPath, [...ids, id]))
  );
