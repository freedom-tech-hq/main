import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { DynamicSyncableId, SyncablePath } from 'freedom-sync-types';
import { syncableItemTypes } from 'freedom-sync-types';

import type { MutableFlatFileAccessor } from '../../types/MutableFlatFileAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableSyncableAtPath } from '../get/getMutableSyncableAtPath.ts';

export const createBinaryFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: MutableSyncableStore,
    parentPath: SyncablePath,
    id: DynamicSyncableId,
    value: Uint8Array
  ): PR<MutableFlatFileAccessor, 'conflict' | 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const parent = await getMutableSyncableAtPath(trace, store, parentPath, syncableItemTypes.exclude('flatFile'));
    if (!parent.ok) {
      return parent;
    }

    return parent.value.createBinaryFile(trace, { id, value });
  }
);
