import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { DynamicSyncableItemName, SyncableOriginOptions, SyncablePath } from 'freedom-sync-types';
import { syncableItemTypes } from 'freedom-sync-types';

import { isSyncableValidationEnabledProvider } from '../../internal/context/isSyncableValidationEnabled.ts';
import type { MutableSyncableFileAccessor } from '../../types/MutableSyncableFileAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableSyncableAtPath } from '../get/getMutableSyncableAtPath.ts';

export const createBinaryFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    { name, value, trustedTimeSignature }: Partial<SyncableOriginOptions> & { name?: DynamicSyncableItemName; value: Uint8Array }
  ): PR<MutableSyncableFileAccessor, 'conflict' | 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    // Disabling validation since we're creating something new -- and this might be a new access control bundle for example, which would
    // make checking it impossible anyway
    const parent = await isSyncableValidationEnabledProvider(
      trace,
      false,
      async (trace) => await getMutableSyncableAtPath(trace, store, path.parentPath!, syncableItemTypes.exclude('file'))
    );
    if (!parent.ok) {
      return parent;
    }

    return await parent.value.createBinaryFile(trace, { id: path.lastId!, name, value, trustedTimeSignature });
  }
);
