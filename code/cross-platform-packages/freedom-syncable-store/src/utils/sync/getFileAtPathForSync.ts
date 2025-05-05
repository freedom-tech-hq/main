import type { PR } from 'freedom-async';
import { allResultsNamed, makeAsyncResultFunc } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemMetadata, SyncablePath, SyncStrategy } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { isSyncableValidationEnabledProvider } from '../../internal/context/isSyncableValidationEnabled.ts';
import { getSyncableAtPath } from '../get/getSyncableAtPath.ts';

export const getFileAtPathForSync = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, path: SyncablePath, _options: { strategy: SyncStrategy }) =>
    await isSyncableValidationEnabledProvider(trace, false, async (trace): PR<{ data: Uint8Array; metadata: SyncableItemMetadata }> => {
      const file = await getSyncableAtPath(trace, store, path, 'file');
      if (!file.ok) {
        return generalizeFailureResult(trace, file, ['not-found', 'untrusted', 'wrong-type']);
      }

      return await allResultsNamed(
        trace,
        {},
        {
          data: file.value.getEncodedBinary(trace),
          metadata: file.value.getMetadata(trace)
        }
      );
    })
);
