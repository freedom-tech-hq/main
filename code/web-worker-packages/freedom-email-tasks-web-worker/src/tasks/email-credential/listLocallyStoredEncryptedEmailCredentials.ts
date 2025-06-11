import type { PR, SuccessResult } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess, sleep, uncheckedResult } from 'freedom-async';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
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
      return await makeDemoModeResult();
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
        webAuthnCredentialId: storedCredential.value.webAuthnCredentialId
      });
    });
  }
);

// Helpers

let makeDemoModeResult: () => Promise<SuccessResult<LocallyStoredEncryptedEmailCredentialInfo[]>> = () => {
  throw new Error();
};

DEV: makeDemoModeResult = async () => {
  await sleep(Math.random() * ONE_SEC_MSEC);

  return makeSuccess([
    {
      email: `demo@${getConfig().defaultEmailDomain}`,
      locallyStoredCredentialId: locallyStoredCredentialIdInfo.make('demo'),
      webAuthnCredentialId: undefined
    } satisfies LocallyStoredEncryptedEmailCredentialInfo
  ]);
};
