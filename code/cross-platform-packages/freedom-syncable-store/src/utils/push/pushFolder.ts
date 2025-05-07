import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath, SyncBatchContents } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { createViaSyncFolderAtPath } from '../../internal/utils/sync/createViaSyncFolderAtPath.ts';
import { pushBatchContents } from './internal/pushBatchContents.ts';

export const pushFolder = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: MutableSyncableStore,
    {
      path,
      metadata,
      batchContents
    }: {
      path: SyncablePath;
      metadata: SyncableItemMetadata;
      batchContents?: SyncBatchContents;
    }
  ): PR<undefined, 'not-found'> => {
    if (path.ids.length === 0) {
      // Nothing to do for root
      return makeSuccess(undefined);
    }

    const folder = await disableLam('conflict', createViaSyncFolderAtPath)(trace, store, path, metadata);
    if (!folder.ok) {
      // Treating conflicts as ok since this will often be the case when using a batch strategy or when syncing with predicable ids
      if (folder.value.errorCode !== 'conflict') {
        return generalizeFailureResult(
          trace,
          excludeFailureResult(folder, 'conflict'),
          ['untrusted', 'wrong-type'],
          `Failed to push folder: ${path.toString()}`
        );
      }
    }

    if (batchContents !== undefined) {
      return await pushBatchContents(trace, store, path, batchContents);
    }

    return makeSuccess(undefined);
  }
);
