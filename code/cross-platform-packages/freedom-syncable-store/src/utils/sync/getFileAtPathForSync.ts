import { allResultsNamed, makeAsyncResultFunc } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncablePath, SyncStrategy } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { disableSyncableValidation } from '../../internal/context/isSyncableValidationEnabled.ts';
import { getSyncableAtPath } from '../get/getSyncableAtPath.ts';

// TODO: reenable validation in a smarter way
export const getFileAtPathForSync = makeAsyncResultFunc(
  [import.meta.filename],
  disableSyncableValidation(async (trace, store: SyncableStore, path: SyncablePath, _options: { strategy: SyncStrategy }) => {
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
