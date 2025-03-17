import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';

import type { AccessControlledFolderAccessor } from '../../types/AccessControlledFolderAccessor.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getSyncableAtPath } from './getSyncableAtPath.ts';

export const getFolderAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    path: SyncablePath
  ): PR<AccessControlledFolderAccessor, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> =>
    getSyncableAtPath(trace, store, path, 'folder')
);
