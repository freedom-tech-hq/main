import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';

export const removeLocallyStoredEncryptedEmailCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, localUuid: Uuid): PR<undefined, 'not-found'> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const deleted = await emailCredentialStore.mutableObject(localUuid).delete(trace);
    if (!deleted.ok) {
      return deleted;
    }

    return makeSuccess(undefined);
  }
);
