import type { PR, SuccessResult } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, sleep, uncheckedResult } from 'freedom-async';
import { base64String, ONE_SEC_MSEC } from 'freedom-basic-data';
import { NotFoundError } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import { decryptBufferWithPassword } from 'freedom-crypto';
import { type EmailUserId, emailUserIdInfo } from 'freedom-email-api';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { decryptEmailCredentialWithPassword } from '../../internal/utils/decryptEmailCredentialWithPassword.ts';
import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';
import type { LocallyStoredEncryptedEmailCredentialPasswordType } from '../../types/email-credential/LocallyStoredEncryptedEmailCredentialPasswordType.ts';
import type { LocallyStoredCredentialId } from '../../types/id/LocallyStoredCredentialId.ts';
import { isDemoMode } from '../config/demo-mode.ts';

export const activateUserWithLocallyStoredEncryptedEmailCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      locallyStoredCredentialId,
      password,
      passwordType
    }: {
      locallyStoredCredentialId: LocallyStoredCredentialId;
      password: string;
      passwordType: LocallyStoredEncryptedEmailCredentialPasswordType;
    }
  ): PR<{ userId: EmailUserId }, 'not-found'> => {
    DEV: if (isDemoMode()) {
      return await makeDemoModeResult();
    }

    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const activeCredential = useActiveCredential(trace);

    const storedCredential = await emailCredentialStore.object(locallyStoredCredentialId).get(trace);
    if (!storedCredential.ok) {
      return storedCredential;
    }

    switch (passwordType) {
      case 'master':
        break;

      case 'biometrics': {
        if (storedCredential.value.pwEncryptedForBiometrics === undefined) {
          return makeFailure(
            new NotFoundError(trace, { message: `No biometrics credential found for ${locallyStoredCredentialId}`, errorCode: 'not-found' })
          );
        }

        const decryptedMasterPassword = await decryptBufferWithPassword(trace, {
          encryptedValue: base64String.toBuffer(storedCredential.value.pwEncryptedForBiometrics),
          password
        });
        if (!decryptedMasterPassword.ok) {
          return decryptedMasterPassword;
        }

        password = Buffer.from(decryptedMasterPassword.value).toString('utf-8');

        break;
      }
    }

    const decryptedCredential = await decryptEmailCredentialWithPassword(trace, {
      encryptedCredential: storedCredential.value.encryptedCredential,
      password
    });
    if (!decryptedCredential.ok) {
      return decryptedCredential;
    }

    activeCredential.credential = decryptedCredential.value;

    return makeSuccess({ userId: decryptedCredential.value.userId });
  }
);

// Helpers

let makeDemoModeResult: () => Promise<SuccessResult<{ userId: EmailUserId }>> = () => {
  throw new Error();
};

DEV: makeDemoModeResult = async () => {
  await sleep(Math.random() * ONE_SEC_MSEC);

  return makeSuccess({
    userId: emailUserIdInfo.make(makeUuid())
  });
};
