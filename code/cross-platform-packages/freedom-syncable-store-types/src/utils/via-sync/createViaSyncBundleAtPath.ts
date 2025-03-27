import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { StaticSyncablePath, SyncableBundleMetadata } from 'freedom-sync-types';
import { syncableItemTypes } from 'freedom-sync-types';

import type { MutableFileStore } from '../../types/MutableFileStore.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableParentSyncable } from '../get/getMutableParentSyncable.ts';

export const createViaSyncBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    path: StaticSyncablePath,
    metadata: SyncableBundleMetadata
  ): PR<MutableFileStore, 'deleted' | 'conflict' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const parent = await getMutableParentSyncable(trace, store, path, syncableItemTypes.exclude('flatFile'));
    if (!parent.ok) {
      return parent;
    }

    return await parent.value.createBundle(trace, { mode: 'via-sync', id: path.lastId!, metadata });
  }
);
