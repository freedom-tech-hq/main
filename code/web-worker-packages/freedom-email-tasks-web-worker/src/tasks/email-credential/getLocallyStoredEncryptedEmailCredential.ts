import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { EncryptedEmailCredential } from 'freedom-email-api';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';
import type { LocallyStoredCredentialId } from '../../types/id/LocallyStoredCredentialId.ts';

export const getLocallyStoredEncryptedEmailCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, locallyStoredCredentialId: LocallyStoredCredentialId): PR<EncryptedEmailCredential, 'not-found'> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const storedCredential = await emailCredentialStore.object(locallyStoredCredentialId).get(trace);
    if (!storedCredential.ok) {
      return storedCredential;
    }

    return makeSuccess(storedCredential.value.encryptedCredential);
  }
);
