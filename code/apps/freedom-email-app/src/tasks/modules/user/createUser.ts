import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { prefixedUuidId } from 'freedom-sync-types';
import { createBundleAtPath, createConflictFreeDocumentBundleAtPath, initializeRoot } from 'freedom-syncable-store-types';

import { mailCollectionIdInfo } from '../../../modules/mail-types/MailCollectionId.ts';
import type { EmailUserId } from '../../../types/EmailUserId.ts';
import { MAIL_COLLECTIONS_BUNDLE_ID, MAIL_FOLDER_ID, MAIL_STORAGE_BUNDLE_ID } from '../../consts/user-syncable-paths.js';
import { useActiveUserId } from '../../contexts/active-user-id.ts';
import { makeNewMailCollectionDocument } from '../../types/MailCollectionDocument.ts';
import { createSyncableFolderForUserWithDefaultInitialAccess } from '../internal/storage/createSyncableFolderForUserWithDefaultInitialAccess.ts';
import { getUserFs } from '../internal/storage/getUserFs.ts';
import { createInitialMockContentForUser } from '../internal/user/createInitialMockContentForUser.ts';
import { createUserIdAndCryptoKeys } from '../internal/user/createUserIdAndCryptoKeys.ts';

/**
 * Creates:
 * - crypto keys
 * - user ID
 * - a "mail-collections" folder with initial access controls (signed with the new signing key)
 * - an empty "inbox" bundle in the "mail-collections" folder
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

  const userFs = await getUserFs(trace, { userId });
  if (!userFs.ok) {
    return userFs;
  }

  const mailFolderId = await MAIL_FOLDER_ID(userFs.value);
  const mailStorageBundleId = await MAIL_STORAGE_BUNDLE_ID(userFs.value);
  const mailCollectionsBundleId = await MAIL_COLLECTIONS_BUNDLE_ID(userFs.value);
  const mailCollectionsInboxDocumentId = prefixedUuidId('bundle', mailCollectionIdInfo.make());

  const initializedStore = await initializeRoot(trace, userFs.value);
  if (!initializedStore.ok) {
    return generalizeFailureResult(trace, initializedStore, ['conflict', 'not-found']);
  }

  // Mail Folder
  const mailFolder = await createSyncableFolderForUserWithDefaultInitialAccess(trace, {
    userId,
    path: userFs.value.path.append(mailFolderId)
  });
  if (!mailFolder.ok) {
    return generalizeFailureResult(trace, mailFolder, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
  }

  // Mail Storage Bundle
  const mailStorageBundle = await createBundleAtPath(trace, userFs.value, mailFolder.value.path.append(mailStorageBundleId), {});
  if (!mailStorageBundle.ok) {
    return generalizeFailureResult(trace, mailStorageBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
  }

  // Mail Collections Bundle
  const mailCollectionsBundle = await createBundleAtPath(trace, userFs.value, mailFolder.value.path.append(mailCollectionsBundleId), {});
  if (!mailCollectionsBundle.ok) {
    return generalizeFailureResult(trace, mailCollectionsBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
  }

  // Empty Inbox Bundle
  const inboxBundle = await createConflictFreeDocumentBundleAtPath(
    trace,
    userFs.value,
    mailCollectionsBundle.value.path.append(mailCollectionsInboxDocumentId),
    { newDocument: () => makeNewMailCollectionDocument({ name: 'loc:inbox', collectionType: 'inbox' }) }
  );
  if (!inboxBundle.ok) {
    return generalizeFailureResult(trace, inboxBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
  }

  // TODO: TEMP
  await createInitialMockContentForUser(trace, { userId, mailCollectionsInboxDocumentId });

  activeUserId.userId = userId;

  return makeSuccess({ userId });
});
