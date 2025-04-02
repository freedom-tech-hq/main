import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { DynamicSyncableItemName, SyncableOriginOptions, SyncablePath } from 'freedom-sync-types';

import type { MutableSyncableFolderAccessor } from '../../types/MutableSyncableFolderAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableSyncableAtPath } from '../get/getMutableSyncableAtPath.ts';

export const createFolderAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    { name, trustedTimeSignature }: Partial<SyncableOriginOptions> & { name?: DynamicSyncableItemName } = {}
  ): PR<MutableSyncableFolderAccessor, 'conflict' | 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const parent = await getMutableSyncableAtPath(trace, store, path.parentPath!, 'folder');
    if (!parent.ok) {
      return parent;
    }

    return await parent.value.createFolder(trace, { id: path.lastId!, name, trustedTimeSignature });
  }
);
