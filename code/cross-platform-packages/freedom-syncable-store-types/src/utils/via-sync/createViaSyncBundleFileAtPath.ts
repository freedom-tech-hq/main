import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { StaticSyncablePath, SyncableProvenance } from 'freedom-sync-types';
import { syncableItemTypes } from 'freedom-sync-types';

import type { MutableFileStore } from '../../types/MutableFileStore.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableParentSyncable } from '../get/getMutableParentSyncable.ts';

export const createViaSyncBundleFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    path: StaticSyncablePath,
    provenance: SyncableProvenance
  ): PR<MutableFileStore, 'deleted' | 'conflict' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const parent = await getMutableParentSyncable(trace, store, path, syncableItemTypes.exclude('flatFile'));
    if (!parent.ok) {
      return parent;
    }

    return parent.value.createBundleFile(trace, { mode: 'via-sync', id: path.lastId!, provenance });
  }
);
