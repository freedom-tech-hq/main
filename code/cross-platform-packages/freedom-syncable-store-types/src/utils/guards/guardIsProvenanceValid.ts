import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { UnauthorizedError } from 'freedom-common-errors';

import type { SyncableItemAccessor } from '../../types/SyncableItemAccessor.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import type { SyncableStoreAccessControlDocument } from '../../types/SyncableStoreAccessControlDocument.ts';
import { isProvenanceValid } from '../validation/isProvenanceValid.ts';

export const guardIsProvenanceValid = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    item: SyncableItemAccessor,
    { accessControlDoc }: { accessControlDoc: SyncableStoreAccessControlDocument }
  ): PR<undefined, 'untrusted'> => {
    const isValid = await isProvenanceValid(trace, store, item, { accessControlDoc });
    if (!isValid.ok) {
      return isValid;
    } else if (!isValid.value) {
      return makeFailure(new UnauthorizedError(trace, { errorCode: 'untrusted' }));
    }

    return makeSuccess(undefined);
  }
);
