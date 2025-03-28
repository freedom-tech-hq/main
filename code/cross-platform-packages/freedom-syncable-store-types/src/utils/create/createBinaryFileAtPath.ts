import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { DynamicSyncableId, OldSyncablePath } from 'freedom-sync-types';
import { syncableItemTypes } from 'freedom-sync-types';

import type { MutableSyncableFileAccessor } from '../../types/MutableSyncableFileAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableSyncableAtPath } from '../get/getMutableSyncableAtPath.ts';

export const createBinaryFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: MutableSyncableStore,
    parentPath: OldSyncablePath,
    id: DynamicSyncableId,
    value: Uint8Array
  ): PR<MutableSyncableFileAccessor, 'conflict' | 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const parent = await getMutableSyncableAtPath(trace, store, parentPath, syncableItemTypes.exclude('file'));
    if (!parent.ok) {
      return parent;
    }

    return await parent.value.createBinaryFile(trace, { id, value });
  }
);
