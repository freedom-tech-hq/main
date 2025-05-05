import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { getOrCreate } from 'freedom-get-or-create';
import type { SyncablePath } from 'freedom-sync-types';
import type { MutableFileStore, MutableSyncableStore } from 'freedom-syncable-store-types';

import { isSyncableValidationEnabledProvider } from '../../internal/context/isSyncableValidationEnabled.ts';
import { createBundleAtPath } from '../create/createBundleAtPath.ts';
import { getMutableSyncableAtPath } from '../get/getMutableSyncableAtPath.ts';

export const getOrCreateBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    path: SyncablePath
  ): PR<MutableFileStore, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> =>
    await isSyncableValidationEnabledProvider(
      trace,
      false,
      async (trace) =>
        await getOrCreate(trace, {
          get: (trace) => getMutableSyncableAtPath(trace, store, path, 'bundle'),
          create: (trace) => createBundleAtPath(trace, store, path)
        })
    )
);
