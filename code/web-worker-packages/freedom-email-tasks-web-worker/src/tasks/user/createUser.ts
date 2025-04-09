import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailUserId } from 'freedom-email-sync';
import { getUserMailPaths } from 'freedom-email-user';
import { createBundleAtPath, createFolderAtPath, initializeRoot } from 'freedom-syncable-store-types';

import { useActiveUserId } from '../../contexts/active-user-id.ts';
import { createDefaultCollectionsForUser } from '../../internal/tasks/user/createDefaultCollectionsForUser.ts';
import { createUserIdAndCryptoKeys } from '../../internal/tasks/user/createUserIdAndCryptoKeys.ts';
import { createWelcomeContentForUser } from '../../internal/tasks/user/createWelcomeContentForUser.ts';
import { getOrCreateEmailAccessForUser } from '../../internal/tasks/user/getOrCreateEmailAccessForUser.ts';

/**
 * Creates:
 * - crypto keys
 * - user ID
 * - basic user folder structure
 * - default collections (ex. inbox, sent, spam)
 *
 * @returns the user ID
 */
export const createUser = makeAsyncResultFunc([import.meta.filename], async (trace): PR<{ userId: EmailUserId }> => {
  const activeUserId = useActiveUserId(trace);

  const userIdAndCryptoKeys = await createUserIdAndCryptoKeys(trace);
  if (!userIdAndCryptoKeys.ok) {
    return userIdAndCryptoKeys;
  }

  const { userId } = userIdAndCryptoKeys.value;

  const access = await getOrCreateEmailAccessForUser(trace, { userId });
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
  const createdDefaultCollections = await createDefaultCollectionsForUser(trace, { userId });
  if (!createdDefaultCollections.ok) {
    return createdDefaultCollections;
  }

  const welcomeContentAdded = await createWelcomeContentForUser(trace, { userId });
  if (!welcomeContentAdded.ok) {
    return welcomeContentAdded;
  }

  activeUserId.userId = userId;

  return makeSuccess({ userId });
});
