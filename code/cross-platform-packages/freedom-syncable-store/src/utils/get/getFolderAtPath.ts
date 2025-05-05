import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableFolderAccessor, SyncableStore } from 'freedom-syncable-store-types';

import { getSyncableAtPath } from './getSyncableAtPath.ts';

export const getFolderAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, path: SyncablePath): PR<SyncableFolderAccessor, 'not-found' | 'untrusted' | 'wrong-type'> =>
    await getSyncableAtPath(trace, store, path, 'folder')
);
