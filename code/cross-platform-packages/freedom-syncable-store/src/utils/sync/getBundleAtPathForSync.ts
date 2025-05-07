import type { PR } from 'freedom-async';
import { allResultsNamed, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableId, SyncableItemMetadata, SyncablePath, SyncBatchContents, SyncStrategy } from 'freedom-sync-types';
import type { LocalItemMetadata } from 'freedom-syncable-store-backing-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { disableSyncableValidation } from '../../internal/context/isSyncableValidationEnabled.ts';
import { getSyncBatchContentsForPath } from '../../internal/utils/getSyncBatchContentsForPath.ts';
import { getSyncableAtPath } from '../get/getSyncableAtPath.ts';

// TODO: reenable validation in a smarter way
export const getBundleAtPathForSync = makeAsyncResultFunc(
  [import.meta.filename],
  disableSyncableValidation(
    async (
      trace,
      store: SyncableStore,
      path: SyncablePath,
      { strategy }: { strategy: SyncStrategy }
    ): PR<{
      metadata: SyncableItemMetadata;
      metadataById: Partial<Record<SyncableId, SyncableItemMetadata & LocalItemMetadata>>;
      batchContents?: SyncBatchContents;
    }> => {
      const bundle = await getSyncableAtPath(trace, store, path, 'bundle');
      if (!bundle.ok) {
        return generalizeFailureResult(trace, bundle, ['not-found', 'untrusted', 'wrong-type']);
      }

      let batchContents: SyncBatchContents | undefined;
      switch (strategy) {
        case 'default':
          break; // Nothing special to do
        case 'batch': {
          // Loading batches is always best effort
          const loaded = await getSyncBatchContentsForPath(trace, store, path);
          if (loaded.ok) {
            batchContents = loaded.value;
          }
        }
      }

      return await allResultsNamed(
        trace,
        {},
        {
          metadata: bundle.value.getMetadata(trace),
          metadataById: bundle.value.getMetadataById(trace),
          batchContents: Promise.resolve(makeSuccess(batchContents))
        }
      );
    }
  )
);
