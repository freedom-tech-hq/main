import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath, SyncBatchContents } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { createViaSyncBundleAtPath } from '../../internal/utils/sync/createViaSyncBundleAtPath.ts';
import { pushBatchContents } from './internal/pushBatchContents.ts';

export const pushBundle = makeAsyncResultFunc(
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
    const bundle = await disableLam('conflict', createViaSyncBundleAtPath)(trace, store, path, metadata);
    if (!bundle.ok) {
      // Treating conflicts as ok since this will often be the case when using a batch strategy or when syncing with predicable ids
      if (bundle.value.errorCode !== 'conflict') {
        return generalizeFailureResult(
          trace,
          excludeFailureResult(bundle, 'conflict'),
          ['untrusted', 'wrong-type'],
          `Failed to push bundle: ${path.toString()}`
        );
      }
    }

    if (batchContents !== undefined) {
      return await pushBatchContents(trace, store, path, batchContents);
    }

    return makeSuccess(undefined);
  }
);
