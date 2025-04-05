import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { UnauthorizedError } from 'freedom-common-errors';

import { useIsSyncableValidationEnabled } from '../../internal/context/isSyncableValidationEnabled.ts';
import type { SyncableItemAccessor } from '../../types/SyncableItemAccessor.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { isProvenanceValid } from '../validation/isProvenanceValid.ts';

export const guardIsProvenanceValid = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, item: SyncableItemAccessor): PR<undefined, 'untrusted'> => {
    if (!useIsSyncableValidationEnabled(trace).enabled) {
      return makeSuccess(undefined);
    }

    const isValid = await isProvenanceValid(trace, store, item);
    if (!isValid.ok) {
      return isValid;
    } else if (!isValid.value) {
      return makeFailure(new UnauthorizedError(trace, { errorCode: 'untrusted' }));
    }

    return makeSuccess(undefined);
  }
);
