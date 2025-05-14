import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import { getLocalHashesRelativeToBasePathWithGlob } from 'freedom-local-sync';
import type { SyncablePath, SyncGlob, SyncPullArgs } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

export const getSyncPullArgsForGlob = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, { basePath, glob }: { basePath: SyncablePath; glob: SyncGlob }): PR<SyncPullArgs> => {
    const localHashesRelativeToBasePath = await getLocalHashesRelativeToBasePathWithGlob(trace, store, { basePath, glob });
    if (!localHashesRelativeToBasePath.ok) {
      return localHashesRelativeToBasePath;
    }

    return makeSuccess({
      basePath,
      localHashesRelativeToBasePath: localHashesRelativeToBasePath.value,
      sendData: true,
      glob
    });
  }
);
