import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { type Uuid } from 'freedom-basic-data';
import type { EmailUserId } from 'freedom-email-sync';
import { decryptEmailCredentialWithPassword } from 'freedom-email-user';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';

export const activateUserWithLocallyStoredEncryptedEmailCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { localCredentialUuid, password }: { localCredentialUuid: Uuid; password: string }
  ): PR<{ userId: EmailUserId }, 'not-found'> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const activeCredential = useActiveCredential(trace);

    const encryptedCredential = await emailCredentialStore.object(localCredentialUuid).get(trace);
    if (!encryptedCredential.ok) {
      return encryptedCredential;
    }

    const decryptedCredential = await decryptEmailCredentialWithPassword(trace, {
      encryptedEmailCredential: encryptedCredential.value.encrypted,
      password
    });
    if (!decryptedCredential.ok) {
      return decryptedCredential;
    }

    activeCredential.credential = decryptedCredential.value;

    return makeSuccess({ userId: decryptedCredential.value.userId });
  }
);
