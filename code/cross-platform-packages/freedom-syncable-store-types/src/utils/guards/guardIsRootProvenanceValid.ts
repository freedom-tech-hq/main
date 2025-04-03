import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { UnauthorizedError } from 'freedom-common-errors';

import type { SyncableStore } from '../../types/SyncableStore.ts';
import { isRootProvenanceValid } from '../validation/isRootProvenanceValid.ts';

export const guardIsRootProvenanceValid = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore): PR<undefined, 'untrusted'> => {
    const isValid = await isRootProvenanceValid(trace, store);
    if (!isValid.ok) {
      return isValid;
    } else if (!isValid.value) {
      return makeFailure(new UnauthorizedError(trace, { errorCode: 'untrusted' }));
    }

    return makeSuccess(undefined);
  }
);
