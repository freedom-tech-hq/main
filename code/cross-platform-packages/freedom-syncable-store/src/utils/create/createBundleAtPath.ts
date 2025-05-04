import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { DynamicSyncableItemName, SyncableOriginOptions, SyncablePath } from 'freedom-sync-types';
import { syncableItemTypes } from 'freedom-sync-types';
import type { MutableSyncableBundleAccessor, MutableSyncableStore } from 'freedom-syncable-store-types';

import { isSyncableValidationEnabledProvider } from '../../internal/context/isSyncableValidationEnabled.ts';
import { getMutableSyncableAtPath } from '../get/getMutableSyncableAtPath.ts';

export const createBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    { name, trustedTimeSignature }: Partial<SyncableOriginOptions> & { name?: DynamicSyncableItemName } = {}
  ): PR<MutableSyncableBundleAccessor, 'conflict' | 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
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

    return await parent.value.createBundle(trace, { id: path.lastId!, name, trustedTimeSignature });
  }
);
