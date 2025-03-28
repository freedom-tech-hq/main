import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { OldSyncablePath } from 'freedom-sync-types';

import type { SyncableFolderAccessor } from '../../types/SyncableFolderAccessor.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getSyncableAtPath } from './getSyncableAtPath.ts';

export const getFolderAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    path: OldSyncablePath
  ): PR<SyncableFolderAccessor, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> =>
    await getSyncableAtPath(trace, store, path, 'folder')
);
