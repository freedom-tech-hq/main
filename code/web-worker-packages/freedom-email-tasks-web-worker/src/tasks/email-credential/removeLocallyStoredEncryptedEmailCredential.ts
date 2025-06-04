import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';
import type { LocallyStoredCredentialId } from '../../types/id/LocallyStoredCredentialId.ts';

export const removeLocallyStoredEncryptedEmailCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, locallyStoredCredentialId: LocallyStoredCredentialId): PR<undefined, 'not-found'> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const deleted = await emailCredentialStore.mutableObject(locallyStoredCredentialId).delete(trace);
    if (!deleted.ok) {
      return deleted;
    }

    return makeSuccess(undefined);
  }
);
