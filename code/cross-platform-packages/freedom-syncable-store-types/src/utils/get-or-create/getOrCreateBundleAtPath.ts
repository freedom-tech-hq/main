import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';

import type { MutableFileStore } from '../../types/MutableFileStore.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { createBundleAtPath } from '../create/createBundleAtPath.ts';
import { getMutableSyncableAtPath } from '../get/getMutableSyncableAtPath.ts';
import { getOrCreate } from './getOrCreate.ts';

export const getOrCreateBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    path: SyncablePath
  ): PR<MutableFileStore, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> =>
    await getOrCreate(trace, {
      get: (trace) => getMutableSyncableAtPath(trace, store, path, 'bundle'),
      create: (trace) => createBundleAtPath(trace, store, path)
    })
);
