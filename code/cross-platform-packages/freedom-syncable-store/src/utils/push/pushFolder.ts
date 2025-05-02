import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { createViaSyncFolderAtPath } from '../via-sync/createViaSyncFolderAtPath.ts';

export const pushFolder = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    {
      path,
      metadata
    }: {
      path: SyncablePath;
      metadata: SyncableItemMetadata;
    }
  ): PR<undefined, 'not-found'> => {
    if (path.ids.length === 0) {
      // Nothing to do for root
      return makeSuccess(undefined);
    }

    const folder = await createViaSyncFolderAtPath(trace, store, path, metadata);
    if (!folder.ok) {
      return generalizeFailureResult(trace, folder, ['conflict', 'untrusted', 'wrong-type'], `Failed to push folder: ${path.toString()}`);
    }

    return makeSuccess(undefined);
  }
);
