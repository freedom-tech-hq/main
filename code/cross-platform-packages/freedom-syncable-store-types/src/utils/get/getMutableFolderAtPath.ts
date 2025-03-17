import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';

import type { MutableAccessControlledFolderAccessor } from '../../types/MutableAccessControlledFolderAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableSyncableAtPath } from './getMutableSyncableAtPath.ts';

export const getMutableFolderAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    path: SyncablePath
  ): PR<MutableAccessControlledFolderAccessor, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> =>
    getMutableSyncableAtPath(trace, store, path, 'folder')
);
