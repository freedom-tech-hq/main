import type { PR, SuccessResult } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';

import type { MutableFileStore } from '../../types/MutableFileStore.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { getOrCreateBundleAtPath } from './getOrCreateBundleAtPath.ts';

/** Returns the `FileStore` for the last path */
export const getOrCreateBundlesAtPaths = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    firstPath: SyncablePath,
    ...paths: SyncablePath[]
  ): PR<MutableFileStore, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    let lastValue: SuccessResult<MutableFileStore> | undefined;
    for (const path of [firstPath, ...paths]) {
      const done = await getOrCreateBundleAtPath(trace, store, path);
      if (!done.ok) {
        return done;
      }

      lastValue = done;
    }

    return lastValue!;
  }
);
