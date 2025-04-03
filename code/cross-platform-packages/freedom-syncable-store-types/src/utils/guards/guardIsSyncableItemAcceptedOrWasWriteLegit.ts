import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ForbiddenError } from 'freedom-common-errors';

import type { SyncableItemAccessor } from '../../types/SyncableItemAccessor.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import type { SyncableStoreAccessControlDocument } from '../../types/SyncableStoreAccessControlDocument.ts';
import { isSyncableItemAcceptedOrWasWriteLegit } from '../validation/isSyncableItemAcceptedOrWasWriteLegit.ts';

export const guardIsSyncableItemAcceptedOrWasWriteLegit = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    item: SyncableItemAccessor,
    { accessControlDoc }: { accessControlDoc: SyncableStoreAccessControlDocument }
  ): PR<undefined, 'untrusted'> => {
    const acceptedOrLegitWrite = await isSyncableItemAcceptedOrWasWriteLegit(trace, store, item, { accessControlDoc });
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
