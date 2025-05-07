import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableItemType, SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { disableSyncableValidation } from '../../internal/context/isSyncableValidationEnabled.ts';
import { getSyncableAtPath } from '../get/getSyncableAtPath.ts';

export const getSyncableItemTypeAtPathForSync = makeAsyncResultFunc(
  [import.meta.filename],
  disableSyncableValidation(async (trace, store: SyncableStore, path: SyncablePath): PR<SyncableItemType, 'not-found'> => {
    const localItemAccessor = await getSyncableAtPath(trace, store, path);
    if (!localItemAccessor.ok) {
      return generalizeFailureResult(trace, localItemAccessor, ['untrusted', 'wrong-type']);
    }

    return makeSuccess(localItemAccessor.value.type);
  }),
  { deepDisableLam: 'not-found' }
);
