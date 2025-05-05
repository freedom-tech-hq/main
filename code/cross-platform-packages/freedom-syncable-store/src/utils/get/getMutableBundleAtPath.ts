import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';
import type { MutableFileStore, MutableSyncableStore } from 'freedom-syncable-store-types';

import { getMutableSyncableAtPath } from './getMutableSyncableAtPath.ts';

export const getMutableBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    path: SyncablePath
  ): PR<MutableFileStore, 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> =>
    await getMutableSyncableAtPath(trace, store, path, 'bundle')
);
