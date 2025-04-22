import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SyncableItemAccessor, SyncableStore } from 'freedom-syncable-store-types';

import { useIsSyncableValidationEnabled } from '../../internal/context/isSyncableValidationEnabled.ts';
import { guardIsProvenanceValid } from './guardIsProvenanceValid.ts';
import { guardIsSyncableItemAcceptedOrWasWriteLegit } from './guardIsSyncableItemAcceptedOrWasWriteLegit.ts';

export const guardIsSyncableItemTrusted = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, item: SyncableItemAccessor): PR<undefined, 'untrusted'> => {
    if (!useIsSyncableValidationEnabled(trace).enabled) {
      return makeSuccess(undefined);
    }

    const provenanceGuard = await guardIsProvenanceValid(trace, store, item);
    if (!provenanceGuard.ok) {
      return provenanceGuard;
    }

    const acceptedOrLegitWriteGuard = await guardIsSyncableItemAcceptedOrWasWriteLegit(trace, store, item);
    if (!acceptedOrLegitWriteGuard.ok) {
      return acceptedOrLegitWriteGuard;
    }

    return makeSuccess(undefined);
  }
);
