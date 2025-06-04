import type { PR, SuccessResult } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';
import type { LocallyStoredEncryptedEmailCredentialInfo } from '../../types/email-credential/LocallyStoredEncryptedEmailCredentialInfo.ts';
import { locallyStoredCredentialIdInfo } from '../../types/id/LocallyStoredCredentialId.ts';
import { getConfig } from '../config/config.ts';
import { isDemoMode } from '../config/demo-mode.ts';

export const listLocallyStoredEncryptedEmailCredentials = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<LocallyStoredEncryptedEmailCredentialInfo[]> => {
    DEV: if (isDemoMode()) {
      return makeDemoModeResult();
    }

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
        locallyStoredCredentialId: key,
        email: storedCredential.value.encryptedCredential.email,
        hasBiometricEncryption: storedCredential.value.pwEncryptedForBiometrics !== undefined
      });
    });
  }
);

// Helpers

let makeDemoModeResult: () => SuccessResult<LocallyStoredEncryptedEmailCredentialInfo[]> = () => {
  throw new Error();
};

DEV: makeDemoModeResult = () =>
  makeSuccess([
    {
      email: `demo@${getConfig().defaultEmailDomain}`,
      hasBiometricEncryption: false,
      locallyStoredCredentialId: locallyStoredCredentialIdInfo.make('demo')
    } satisfies LocallyStoredEncryptedEmailCredentialInfo
  ]);
