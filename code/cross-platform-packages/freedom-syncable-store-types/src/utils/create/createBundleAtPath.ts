import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { DynamicSyncableId, SyncablePath } from 'freedom-sync-types';
import { syncableItemTypes } from 'freedom-sync-types';

import type { MutableBundleAccessor } from '../../types/MutableBundleAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableSyncableAtPath } from '../get/getMutableSyncableAtPath.ts';

export const createBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    parentPath: SyncablePath,
    id: DynamicSyncableId
  ): PR<MutableBundleAccessor, 'conflict' | 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const parent = await getMutableSyncableAtPath(trace, store, parentPath, syncableItemTypes.exclude('flatFile'));
    if (!parent.ok) {
      return parent;
    }

    return await parent.value.createBundle(trace, { id });
  }
);
