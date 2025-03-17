import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';

import type { FileStore } from '../../types/FileStore.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getSyncableAtPath } from './getSyncableAtPath.ts';

export const getBundleFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    path: SyncablePath
  ): PR<FileStore, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> =>
    getSyncableAtPath(trace, store, path, 'bundleFile')
);
