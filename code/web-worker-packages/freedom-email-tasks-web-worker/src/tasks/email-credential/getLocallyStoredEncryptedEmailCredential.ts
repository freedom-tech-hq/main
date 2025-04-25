import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import type { Uuid } from 'freedom-contexts';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';

export const getLocallyStoredEncryptedEmailCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, localUuid: Uuid): PR<Base64String, 'not-found'> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const encryptedCredential = await emailCredentialStore.object(localUuid).get(trace);
    if (!encryptedCredential.ok) {
      return encryptedCredential;
    }

    return makeSuccess(encryptedCredential.value.encrypted);
  }
);
