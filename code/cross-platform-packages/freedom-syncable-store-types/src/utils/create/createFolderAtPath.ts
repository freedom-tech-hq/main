import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { DynamicSyncableId, SyncablePath } from 'freedom-sync-types';

import type { MutableAccessControlledFolderAccessor } from '../../types/MutableAccessControlledFolderAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableSyncableAtPath } from '../get/getMutableSyncableAtPath.ts';

export const createFolderAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    parentPath: SyncablePath,
    id: DynamicSyncableId
  ): PR<MutableAccessControlledFolderAccessor, 'conflict' | 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const parent = await getMutableSyncableAtPath(trace, store, parentPath, 'folder');
    if (!parent.ok) {
      return parent;
    }

    return parent.value.createFolder(trace, { id });
  }
);
