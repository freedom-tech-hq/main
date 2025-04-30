import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableId, SyncablePath } from 'freedom-sync-types';

import type { OpfsSyncableStoreBackingItem } from '../types/OpfsSyncableStoreBackingItem.ts';
import { getBackingItem } from './getBackingItem.ts';

export const makeGetFuncForPath = (rootHandle: FileSystemDirectoryHandle, path: SyncablePath) =>
  makeAsyncResultFunc(
    [import.meta.filename],
    async (_trace, id: SyncableId): PR<OpfsSyncableStoreBackingItem, 'not-found' | 'wrong-type'> =>
      makeSuccess(getBackingItem(rootHandle, path, id))
  );
