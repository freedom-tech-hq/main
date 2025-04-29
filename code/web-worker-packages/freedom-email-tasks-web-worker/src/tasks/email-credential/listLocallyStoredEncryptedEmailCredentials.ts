import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';
import type { LocallyStoredEncryptedEmailCredentialInfo } from '../../types/email-credential/LocallyStoredEncryptedEmailCredentialInfo.ts';

export const listLocallyStoredEncryptedEmailCredentials = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<LocallyStoredEncryptedEmailCredentialInfo[]> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const keys = await emailCredentialStore.keys.asc().keys(trace);
    if (!keys.ok) {
      return keys;
    }

    return await allResultsMapped(trace, keys.value, {}, async (trace, key): PR<LocallyStoredEncryptedEmailCredentialInfo> => {
      const storedCredential = await emailCredentialStore.object(key).get(trace);
      if (!storedCredential.ok) {
        return generalizeFailureResult(trace, storedCredential, 'not-found');
      }

      return makeSuccess({
        localUuid: key,
        description: storedCredential.value.description,
        hasBiometricEncryption: storedCredential.value.pwEncryptedForBiometrics !== undefined
      });
    });
  }
);
