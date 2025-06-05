import type { PR } from 'freedom-async';
import { bestEffort, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import type { EmailUserId, EncryptedEmailCredential } from 'freedom-email-api';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { storeEncryptedEmailCredentialLocally } from '../../internal/tasks/email-credential/storeEncryptedEmailCredentialLocally.ts';
import { reserveEmail } from '../../internal/tasks/user/reserveEmail.ts';
import { createEmailCredential } from '../../internal/utils/createEmailCredential.ts';
import { encryptEmailCredentialWithPassword } from '../../internal/utils/encryptEmailCredentialWithPassword.ts';
import { getConfig } from '../config/config.ts';
import { storeCredentialsOnServer } from '../email-credential/storeCredentialsOnServer.ts';

/**
 * - Creates email credential
 * - Reserves email address on remote
 * - Stores encrypted email credential locally
 * - Optionally stores encrypted email credential on remote
 *
 * @returns the user ID and encrypted email credential info
 */
export const createUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      emailUsername,
      masterPassword,
      saveCredentialsOnRemote
    }: {
      emailUsername: string;
      masterPassword: string;
      saveCredentialsOnRemote: boolean;
    }
  ): PR<
    { userId: EmailUserId; encryptedEmailCredential: EncryptedEmailCredential; locallyStoredCredentialUuid?: Uuid },
    'email-unavailable'
  > => {
    const activeCredential = useActiveCredential(trace);

    // --- Creating credential and store ---

    const credential = await createEmailCredential(trace);
    if (!credential.ok) {
      return credential;
    }

    // --- Reserving email address on remote ---

    const reserved = await reserveEmail(trace, credential.value, { emailUsername });
    if (!reserved.ok) {
      return reserved;
    }

    // --- Storing encrypted email credential ---

    const email = `${emailUsername}@${getConfig().defaultEmailDomain}`;

    const encryptedCredential = await encryptEmailCredentialWithPassword(trace, {
      email,
      credential: credential.value,
      password: masterPassword
    });
    if (!encryptedCredential.ok) {
      return encryptedCredential;
    }

    const stored = await storeEncryptedEmailCredentialLocally(trace, { encryptedEmailCredential: encryptedCredential.value });
    if (!stored.ok) {
      return stored;
    }

    const locallyStoredCredentialId = stored.value.locallyStoredCredentialId;

    // --- Saving encrypted email credential on remote, if desired ---

    if (saveCredentialsOnRemote) {
      // TODO: need some kind of fallback / user notification if this fails
      await bestEffort(
        trace,
        storeCredentialsOnServer(trace, {
          userId: credential.value.userId,
          encryptedCredential: encryptedCredential.value,
          signingKeys: credential.value.privateKeys
        })
      );
    }

    // --- Setting the new credential as the active credential ---

    activeCredential.credential = credential.value;

    return makeSuccess({
      userId: credential.value.userId,
      encryptedEmailCredential: encryptedCredential.value,
      locallyStoredCredentialId
    });
  }
);
