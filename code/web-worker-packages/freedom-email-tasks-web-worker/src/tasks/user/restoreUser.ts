import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { type EmailCredential, encryptEmailCredentialWithPassword } from 'freedom-email-user';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { storeEncryptedEmailCredentialLocally } from '../../internal/tasks/email-credential/storeEncryptedEmailCredentialLocally.ts';

export const restoreUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    credential: EmailCredential,
    {
      install
    }: {
      /** If provided, the credential is encrypted with the specified password and stored locally */
      install?: {
        description: string;
        password: string;
      };
    }
  ) => {
    const activeCredential = useActiveCredential(trace);

    if (install !== undefined) {
      const encryptedEmailCredential = await encryptEmailCredentialWithPassword(trace, { credential, password: install.password });
      if (!encryptedEmailCredential.ok) {
        return encryptedEmailCredential;
      }

      const storedEncryptedEmailCredential = await storeEncryptedEmailCredentialLocally(trace, {
        description: install.description,
        encryptedEmailCredential: encryptedEmailCredential.value
      });
      if (!storedEncryptedEmailCredential.ok) {
        return storedEncryptedEmailCredential;
      }
    }

    activeCredential.credential = credential;

    return makeSuccess(undefined);
  }
);
