import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';

import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
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
  ): PR<undefined> => {
    if (path.ids.length === 0) {
      // Nothing to do for root
      return makeSuccess(undefined);
    }

    const folder = await createViaSyncFolderAtPath(trace, store, path, metadata);
    if (!folder.ok) {
      if (folder.value.errorCode === 'deleted') {
        // Was locally (with respect to the mock remote) deleted, so not interested in this content
        return makeSuccess(undefined);
      }
      return generalizeFailureResult(
        trace,
        excludeFailureResult(folder, 'deleted'),
        ['conflict', 'not-found', 'untrusted', 'wrong-type'],
        `Failed to push folder: ${path.toString()}`
      );
    }

    return makeSuccess(undefined);
  }
);
