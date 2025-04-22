import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { UnauthorizedError } from 'freedom-common-errors';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { useIsSyncableValidationEnabled } from '../../internal/context/isSyncableValidationEnabled.ts';
import { isRootProvenanceValid } from '../validation/isRootProvenanceValid.ts';

export const guardIsRootProvenanceValid = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore): PR<undefined, 'untrusted'> => {
    if (!useIsSyncableValidationEnabled(trace).enabled) {
      return makeSuccess(undefined);
    }

    const isValid = await isRootProvenanceValid(trace, store);
    if (!isValid.ok) {
      return isValid;
    } else if (!isValid.value) {
      return makeFailure(new UnauthorizedError(trace, { errorCode: 'untrusted' }));
    }

    return makeSuccess(undefined);
  }
);
