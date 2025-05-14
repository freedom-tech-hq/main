import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ForbiddenError } from 'freedom-common-errors';
import type { SyncableItemAccessor, SyncableStore } from 'freedom-syncable-store-types';

import { useIsSyncableValidationEnabled } from '../../context/isSyncableValidationEnabled.ts';
import { isSyncableItemAcceptedOrWasWriteLegit } from '../validation/isSyncableItemAcceptedOrWasWriteLegit.ts';

export const guardIsSyncableItemAcceptedOrWasWriteLegit = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, item: SyncableItemAccessor): PR<undefined, 'untrusted'> => {
    if (!useIsSyncableValidationEnabled(trace).enabled) {
      return makeSuccess(undefined);
    }

    const acceptedOrLegitWrite = await isSyncableItemAcceptedOrWasWriteLegit(trace, store, item);
    if (!acceptedOrLegitWrite.ok) {
      return acceptedOrLegitWrite;
    } else if (!acceptedOrLegitWrite.value) {
      // It's also possible that permissions are just temporarily out of sync
      return makeFailure(
        new ForbiddenError(trace, {
          message: `Item ${item.path.toString()} may have been created in an untrusted way`,
          errorCode: 'untrusted'
        })
      );
    }

    return makeSuccess(undefined);
  }
);
