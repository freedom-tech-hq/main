import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { createBundleFileAtPath, createConflictFreeDocumentBundleAtPath, initializeRoot } from 'freedom-syncable-store-types';

import type { EmailUserId } from '../../../types/EmailUserId.js';
import {
  MAIL_COLLECTIONS_BUNDLE_ID,
  MAIL_COLLECTIONS_INBOX_DOCUMENT_ID,
  MAIL_FOLDER_ID,
  MAIL_STORAGE_BUNDLE_ID
} from '../../consts/user-syncable-paths.js';
import { useActiveUserId } from '../../contexts/active-user-id.js';
import { makeNewMailCollectionDocument } from '../../types/MailCollectionDocument.js';
import { createSyncableFolderForUserWithDefaultInitialAccess } from '../internal/storage/createSyncableFolderForUserWithDefaultInitialAccess.js';
import { getUserFs } from '../internal/storage/getUserFs.js';
import { createInitialMockContentForUser } from '../internal/user/createInitialMockContentForUser.js';
import { createUserIdAndCryptoKeys } from '../internal/user/createUserIdAndCryptoKeys.js';

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

  const initializedStore = await initializeRoot(trace, userFs.value);
  if (!initializedStore.ok) {
    return generalizeFailureResult(trace, initializedStore, ['conflict', 'not-found']);
  }

  // Mail Folder
  const mailFolder = await createSyncableFolderForUserWithDefaultInitialAccess(trace, {
    userId,
    parentPath: userFs.value.path,
    id: MAIL_FOLDER_ID
  });
  if (!mailFolder.ok) {
    return generalizeFailureResult(trace, mailFolder, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
  }

  // Mail Storage Bundle
  const mailStorageBundle = await createBundleFileAtPath(trace, userFs.value, mailFolder.value.path, MAIL_STORAGE_BUNDLE_ID);
  if (!mailStorageBundle.ok) {
    return generalizeFailureResult(trace, mailStorageBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
  }

  // Mail Collections Bundle
  const mailCollectionsBundle = await createBundleFileAtPath(trace, userFs.value, mailFolder.value.path, MAIL_COLLECTIONS_BUNDLE_ID);
  if (!mailCollectionsBundle.ok) {
    return generalizeFailureResult(trace, mailCollectionsBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
  }

  // Empty Inbox Bundle
  const inboxBundle = await createConflictFreeDocumentBundleAtPath(
    trace,
    userFs.value,
    mailCollectionsBundle.value.path,
    MAIL_COLLECTIONS_INBOX_DOCUMENT_ID,
    { newDocument: () => makeNewMailCollectionDocument({ name: '[loc:inbox]' }) }
  );
  if (!inboxBundle.ok) {
    return generalizeFailureResult(trace, inboxBundle, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
  }

  // TODO: TEMP
  await createInitialMockContentForUser(trace, { userId });

  activeUserId.userId = userId;

  return makeSuccess({ userId });
});
