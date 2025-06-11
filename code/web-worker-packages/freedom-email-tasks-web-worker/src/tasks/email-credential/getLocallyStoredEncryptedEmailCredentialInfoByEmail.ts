import type { PR, SuccessResult } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeFailure, makeSuccess, sleep, uncheckedResult } from 'freedom-async';
import { ONE_SEC_MSEC } from 'freedom-basic-data';
import { NotFoundError } from 'freedom-common-errors';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';
import type { LocallyStoredEncryptedEmailCredentialInfo } from '../../types/email-credential/LocallyStoredEncryptedEmailCredentialInfo.ts';
import { locallyStoredCredentialIdInfo } from '../../types/id/LocallyStoredCredentialId.ts';
import { getConfig } from '../config/config.ts';
import { isDemoMode } from '../config/demo-mode.ts';

export const getLocallyStoredEncryptedEmailCredentialInfoByEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, email: string): PR<LocallyStoredEncryptedEmailCredentialInfo, 'not-found'> => {
    DEV: if (isDemoMode()) {
      return await makeDemoModeResult();
    }

    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const allKeys = await emailCredentialStore.keys.asc().keys(trace);
    if (!allKeys.ok) {
      return allKeys;
    }

    const foundCredentialInfos: LocallyStoredEncryptedEmailCredentialInfo[] = [];

    const found = await allResultsMapped(trace, allKeys.value, {}, async (trace, locallyStoredCredentialId) => {
      const storedCredential = await emailCredentialStore.mutableObject(locallyStoredCredentialId).get(trace);
      if (!storedCredential.ok) {
        return storedCredential;
      }

      if (storedCredential.value.encryptedCredential.email === email) {
        foundCredentialInfos.push({
          locallyStoredCredentialId,
          email: storedCredential.value.encryptedCredential.email,
          webAuthnCredentialId: storedCredential.value.webAuthnCredentialId
        });
      }

      return makeSuccess(undefined);
    });
    if (!found.ok) {
      return found;
    }

    if (foundCredentialInfos.length === 0) {
      return makeFailure(
        new NotFoundError(trace, {
          message: `No locally stored encrypted email credential found for email: ${email}`,
          errorCode: 'not-found'
        })
      );
    }

    return makeSuccess(foundCredentialInfos[0]);
  }
);

// Helpers

let makeDemoModeResult: () => Promise<SuccessResult<LocallyStoredEncryptedEmailCredentialInfo>> = () => {
  throw new Error();
};

DEV: makeDemoModeResult = async () => {
  await sleep(Math.random() * ONE_SEC_MSEC);

  return makeSuccess({
    email: `demo@${getConfig().defaultEmailDomain}`,
    locallyStoredCredentialId: locallyStoredCredentialIdInfo.make('demo'),
    webAuthnCredentialId: undefined
  });
};
