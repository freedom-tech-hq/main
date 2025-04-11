import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { base64String, type Uuid } from 'freedom-basic-data';
import { NotFoundError } from 'freedom-common-errors';
import type { EmailUserId } from 'freedom-email-sync';
import { decryptEmailCredentialWithPassword } from 'freedom-email-user';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { readKV } from '../../internal/utils/readKV.ts';

export const activateUserWithLocallyStoredEncryptedEmailCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { localCredentialUuid, password }: { localCredentialUuid: Uuid; password: string }
  ): PR<{ userId: EmailUserId }, 'not-found'> => {
    const activeCredential = useActiveCredential(trace);

    const encryptedCredential = await readKV(trace, `EMAIL_CREDENTIAL_${localCredentialUuid}.encrypted`);
    if (!encryptedCredential.ok) {
      return encryptedCredential;
    } else if (encryptedCredential.value === undefined) {
      return makeFailure(new NotFoundError(trace, { errorCode: 'not-found' }));
    } else if (!base64String.is(encryptedCredential.value)) {
      return makeFailure(
        new NotFoundError(trace, { message: `Email credential ${localCredentialUuid} appears to be corrupted`, errorCode: 'not-found' })
      );
    }

    const decryptedCredential = await decryptEmailCredentialWithPassword(trace, {
      encryptedEmailCredential: encryptedCredential.value,
      password
    });
    if (!decryptedCredential.ok) {
      return decryptedCredential;
    }

    activeCredential.credential = decryptedCredential.value;

    return makeSuccess({ userId: decryptedCredential.value.userId });
  }
);
