import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { pushToLocal } from 'freedom-local-sync';
import type { PullOutOfSyncFile, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

export const pushFileToLocal = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { store, file }: { store: MutableSyncableStore; file: PullOutOfSyncFile }, { path }: { path: SyncablePath }) => {
    const pushed = await pushToLocal(trace, store, { basePath: path, item: { metadata: file.metadata, data: file.data } });
    if (!pushed.ok) {
      return pushed;
    }

    return makeSuccess(undefined);
  }
);
