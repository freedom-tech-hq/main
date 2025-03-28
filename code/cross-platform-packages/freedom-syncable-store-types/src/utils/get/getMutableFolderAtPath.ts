import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { OldSyncablePath } from 'freedom-sync-types';

import type { MutableSyncableFolderAccessor } from '../../types/MutableSyncableFolderAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableSyncableAtPath } from './getMutableSyncableAtPath.ts';

export const getMutableFolderAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    path: OldSyncablePath
  ): PR<MutableSyncableFolderAccessor, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> =>
    await getMutableSyncableAtPath(trace, store, path, 'folder')
);
