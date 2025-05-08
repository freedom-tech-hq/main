import type { PR, SuccessResult } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { DynamicSyncableItemName, SyncablePath } from 'freedom-sync-types';
import type { MutableFileStore, MutableSyncableStore } from 'freedom-syncable-store-types';

import { getOrCreateBundleAtPath } from './getOrCreateBundleAtPath.ts';

type BundleInfo = SyncablePath | [SyncablePath, { name?: DynamicSyncableItemName }];

/** Returns the `FileStore` for the last path */
export const getOrCreateBundlesAtPaths = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    first: BundleInfo,
    ...rest: BundleInfo[]
  ): PR<MutableFileStore, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    let lastValue: SuccessResult<MutableFileStore> | undefined;
    for (const info of [first, ...rest]) {
      const [path, options] = Array.isArray(info) ? info : [info, {}];
      const done = await getOrCreateBundleAtPath(trace, store, path, options);
      if (!done.ok) {
        return done;
      }

      lastValue = done;
    }

    return lastValue!;
  }
);
