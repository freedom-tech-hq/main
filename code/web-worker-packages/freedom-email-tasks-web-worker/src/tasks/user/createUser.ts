import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Base64String, Uuid } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailUserId } from 'freedom-email-sync';
import {
  createEmailCredential,
  createInitialSyncableStoreStructureForUser,
  createWelcomeContentForUser,
  encryptEmailCredentialWithPassword
} from 'freedom-email-user';
import { initializeRoot } from 'freedom-syncable-store';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { storeEncryptedEmailCredentialLocally } from '../../internal/tasks/email-credential/storeEncryptedEmailCredentialLocally.ts';
import { getOrCreateEmailAccessForUser } from '../../internal/tasks/user/getOrCreateEmailAccessForUser.ts';

/**
 * Creates:
 * - email credential
 * - basic user folder structure
 * - welcome content
 *
 * The user should keep their user ID and private keys somewhere safe, so they can use them for account recovery or to sign in on other
 * devices
 *
 * @returns the user ID and encrypted email credential
 */
export const createUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      install,
      password
    }: {
      /** If provided, the credential is encrypted with the specified password and stored locally */
      install?: {
        /** Stored with the credential so the user can intelligibly select which credential to use later */
        description: string;
      };
      password: string;
    }
  ): PR<{ userId: EmailUserId; encryptedEmailCredential: Base64String; locallyStoredCredentialUuid?: Uuid }> => {
    const activeCredential = useActiveCredential(trace);

    const credential = await createEmailCredential(trace);
    if (!credential.ok) {
      return credential;
    }

    const userId = credential.value.userId;

    const encryptedEmailCredential = await encryptEmailCredentialWithPassword(trace, { credential: credential.value, password });
    if (!encryptedEmailCredential.ok) {
      return encryptedEmailCredential;
    }

    let locallyStoredCredentialUuid: Uuid | undefined;
    if (install) {
      const storedEncryptedEmailCredential = await storeEncryptedEmailCredentialLocally(trace, {
        description: install.description,
        encryptedEmailCredential: encryptedEmailCredential.value
      });
      if (!storedEncryptedEmailCredential.ok) {
        return storedEncryptedEmailCredential;
      }

      locallyStoredCredentialUuid = storedEncryptedEmailCredential.value.locallyStoredCredentialUuid;
    }

    const access = await getOrCreateEmailAccessForUser(trace, credential.value);
    if (!access.ok) {
      return access;
    }

    const userFs = access.value.userFs;

    const initializedStore = await initializeRoot(trace, userFs);
    if (!initializedStore.ok) {
      return generalizeFailureResult(trace, initializedStore, ['conflict', 'not-found']);
    }

    const createdStructure = await createInitialSyncableStoreStructureForUser(trace, access.value);
    if (!createdStructure.ok) {
      return createdStructure;
    }

    const welcomeContentAdded = await createWelcomeContentForUser(trace, access.value);
    if (!welcomeContentAdded.ok) {
      return welcomeContentAdded;
    }

    activeCredential.credential = credential.value;

    return makeSuccess({
      userId,
      encryptedEmailCredential: encryptedEmailCredential.value,
      locallyStoredCredentialUuid
    });
  }
);
