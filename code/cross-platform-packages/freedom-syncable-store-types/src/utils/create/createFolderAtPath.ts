import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { DynamicSyncableId, OldSyncablePath } from 'freedom-sync-types';

import type { MutableSyncableFolderAccessor } from '../../types/MutableSyncableFolderAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableSyncableAtPath } from '../get/getMutableSyncableAtPath.ts';

export const createFolderAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    parentPath: OldSyncablePath,
    id: DynamicSyncableId
  ): PR<MutableSyncableFolderAccessor, 'conflict' | 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const parent = await getMutableSyncableAtPath(trace, store, parentPath, 'folder');
    if (!parent.ok) {
      return parent;
    }

    return await parent.value.createFolder(trace, { id });
  }
);
