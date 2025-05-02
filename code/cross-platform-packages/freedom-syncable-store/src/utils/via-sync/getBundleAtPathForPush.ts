import type { PR } from 'freedom-async';
import { allResultsNamed, makeAsyncResultFunc } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableId, SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';
import type { LocalItemMetadata } from 'freedom-syncable-store-backing-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { isSyncableValidationEnabledProvider } from '../../internal/context/isSyncableValidationEnabled.ts';
import { getSyncableAtPath } from '../get/getSyncableAtPath.ts';

export const getBundleAtPathForPush = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, path: SyncablePath) =>
    await isSyncableValidationEnabledProvider(
      trace,
      false,
      async (
        trace
      ): PR<{ metadata: SyncableItemMetadata; metadataById: Partial<Record<SyncableId, SyncableItemMetadata & LocalItemMetadata>> }> => {
        const bundle = await getSyncableAtPath(trace, store, path, 'bundle');
        if (!bundle.ok) {
          return generalizeFailureResult(trace, bundle, ['not-found', 'untrusted', 'wrong-type']);
        }

        return await allResultsNamed(
          trace,
          {},
          {
            metadata: bundle.value.getMetadata(trace),
            metadataById: bundle.value.getMetadataById(trace)
          }
        );
      }
    )
);
