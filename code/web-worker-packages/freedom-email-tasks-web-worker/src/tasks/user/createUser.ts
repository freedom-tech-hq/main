import type { PR } from 'freedom-async';
import { bestEffort, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailUserId, EncryptedEmailCredential } from 'freedom-email-sync';
import {
  createEmailCredential,
  createInitialSyncableStoreStructureForUser,
  createWelcomeContentForUser,
  encryptEmailCredentialWithPassword
} from 'freedom-email-user';
import { initializeRoot } from 'freedom-syncable-store';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { storeEncryptedEmailCredentialLocally } from '../../internal/tasks/email-credential/storeEncryptedEmailCredentialLocally.ts';
import { getOrCreateEmailSyncableStore } from '../../internal/tasks/user/getOrCreateEmailSyncableStore.ts';
import { reserveEmail } from '../../internal/tasks/user/reserveEmail.ts';
import { getConfig } from '../config/config.ts';
import { storeCredentialsOnServer } from '../email-credential/storeCredentialsOnServer.ts';

/**
 * - Creates email credential
 * - Reserves email address on remote
 * - Stores encrypted email credential locally
 * - Optionally stores encrypted email credential on remote
 * - Creates basic user folder structure
 * - Creates welcome content
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

    const userId = credential.value.userId;

    const syncableStoreResult = await getOrCreateEmailSyncableStore(trace, credential.value);
    if (!syncableStoreResult.ok) {
      return syncableStoreResult;
    }
    const userFs = syncableStoreResult.value;

    const initializedStore = await initializeRoot(trace, userFs);
    if (!initializedStore.ok) {
      return generalizeFailureResult(trace, initializedStore, ['conflict', 'not-found']);
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
          userId,
          encryptedCredential: encryptedCredential.value,
          signingKeys: credential.value.privateKeys
        })
      );
    }

    // --- Initializing user folder structure ---

    const createdStructure = await createInitialSyncableStoreStructureForUser(trace, userFs);
    if (!createdStructure.ok) {
      return createdStructure;
    }

    const welcomeContentAdded = await createWelcomeContentForUser(trace, userFs);
    if (!welcomeContentAdded.ok) {
      return welcomeContentAdded;
    }

    // --- Setting the new credential as the active credential ---

    activeCredential.credential = credential.value;

    return makeSuccess({
      userId,
      encryptedEmailCredential: encryptedCredential.value,
      locallyStoredCredentialId
    });
  }
);
