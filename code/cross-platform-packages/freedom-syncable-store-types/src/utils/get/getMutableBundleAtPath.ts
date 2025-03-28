import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { OldSyncablePath } from 'freedom-sync-types';

import type { MutableFileStore } from '../../types/MutableFileStore.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getMutableSyncableAtPath } from './getMutableSyncableAtPath.ts';

export const getMutableBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    path: OldSyncablePath
  ): PR<MutableFileStore, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> =>
    await getMutableSyncableAtPath(trace, store, path, 'bundle')
);
