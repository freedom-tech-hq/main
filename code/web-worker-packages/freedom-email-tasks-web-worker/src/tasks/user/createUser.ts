import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailUserId } from 'freedom-email-sync';
import { encryptEmailCredentialWithPassword, getUserMailPaths } from 'freedom-email-user';
import { createBundleAtPath, createFolderAtPath, initializeRoot } from 'freedom-syncable-store-types';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { storeEncryptedEmailCredentialLocally } from '../../internal/tasks/email-credential/storeEncryptedEmailCredentialLocally.ts';
import { createDefaultCollectionsForUser } from '../../internal/tasks/user/createDefaultCollectionsForUser.ts';
import { createEmailCredential } from '../../internal/tasks/user/createEmailCredential.ts';
import { createWelcomeContentForUser } from '../../internal/tasks/user/createWelcomeContentForUser.ts';
import { getOrCreateEmailAccessForUser } from '../../internal/tasks/user/getOrCreateEmailAccessForUser.ts';

/**
 * Creates:
 * - email credential
 * - basic user folder structure
 * - default collections (ex. inbox, sent, spam)
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
  ): PR<{ userId: EmailUserId; encryptedEmailCredential: string }> => {
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

    if (install) {
      const storedEncryptedEmailCredential = await storeEncryptedEmailCredentialLocally(trace, {
        description: install.description,
        encryptedEmailCredential: encryptedEmailCredential.value
      });
      if (!storedEncryptedEmailCredential.ok) {
        return storedEncryptedEmailCredential;
      }
    }

    const access = await getOrCreateEmailAccessForUser(trace, credential.value);
    if (!access.ok) {
      return access;
    }

    const userFs = access.value.userFs;
    const paths = await getUserMailPaths(userFs);

    const initializedStore = await initializeRoot(trace, userFs);
    if (!initializedStore.ok) {
      return generalizeFailureResult(trace, initializedStore, ['conflict', 'not-found']);
    }

    // Mail Storage Folder
    const mailStorageBundle = await createFolderAtPath(trace, userFs, paths.storage.value);
    if (!mailStorageBundle.ok) {
      return generalizeFailureResult(trace, mailStorageBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Out Folder
    const mailOutFolder = await createFolderAtPath(trace, userFs, paths.out.value);
    if (!mailOutFolder.ok) {
      return generalizeFailureResult(trace, mailOutFolder, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Collections Bundle
    const mailCollectionsBundle = await createBundleAtPath(trace, userFs, paths.collections.value);
    if (!mailCollectionsBundle.ok) {
      return generalizeFailureResult(trace, mailCollectionsBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Drafts Bundle
    const mailDraftsBundle = await createBundleAtPath(trace, userFs, paths.drafts.value);
    if (!mailDraftsBundle.ok) {
      return generalizeFailureResult(trace, mailDraftsBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Indexes Bundle
    const mailIndexesBundle = await createBundleAtPath(trace, userFs, paths.indexes.value);
    if (!mailIndexesBundle.ok) {
      return generalizeFailureResult(trace, mailIndexesBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Email Ids by Message Id Index Bundle
    const mailIdsByMessageIdIndexBundle = await createBundleAtPath(trace, userFs, paths.indexes.mailIdsByMessageIdIndex);
    if (!mailIdsByMessageIdIndexBundle.ok) {
      return generalizeFailureResult(trace, mailIdsByMessageIdIndexBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Mail Threads Bundle
    const mailThreadsBundle = await createBundleAtPath(trace, userFs, paths.threads);
    if (!mailThreadsBundle.ok) {
      return generalizeFailureResult(trace, mailThreadsBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // Creating default collections
    const createdDefaultCollections = await createDefaultCollectionsForUser(trace, credential.value);
    if (!createdDefaultCollections.ok) {
      return createdDefaultCollections;
    }

    const welcomeContentAdded = await createWelcomeContentForUser(trace, credential.value);
    if (!welcomeContentAdded.ok) {
      return welcomeContentAdded;
    }

    activeCredential.credential = credential.value;

    return makeSuccess({ userId, encryptedEmailCredential: encryptedEmailCredential.value });
  }
);
