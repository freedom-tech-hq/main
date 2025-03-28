import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { OldSyncablePath } from 'freedom-sync-types';

import type { FileStore } from '../../types/FileStore.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getSyncableAtPath } from './getSyncableAtPath.ts';

export const getBundleAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    path: OldSyncablePath
  ): PR<FileStore, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> =>
    await getSyncableAtPath(trace, store, path, 'bundle')
);
