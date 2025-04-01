import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncableId } from 'freedom-sync-types';
import { prefixedUuidId } from 'freedom-sync-types';
import { createJsonFileAtPath, getMutableConflictFreeDocumentFromBundleAtPath } from 'freedom-syncable-store-types';

import type { MailId } from '../../../../modules/mail-types/MailId.ts';
import { mailIdInfo } from '../../../../modules/mail-types/MailId.ts';
import type { EmailUserId } from '../../../../types/EmailUserId.ts';
import { MAIL_COLLECTIONS_BUNDLE_ID, MAIL_FOLDER_ID, MAIL_STORAGE_BUNDLE_ID } from '../../../consts/user-syncable-paths.js';
import { makeMailCollectionDocumentFromSnapshot } from '../../../types/MailCollectionDocument.ts';
import { storedMailSchema } from '../../../types/StoredMail.ts';
import { getUserFs } from '../storage/getUserFs.ts';

// TODO: remove once services are available
export const createInitialMockContentForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { userId, mailCollectionsInboxDocumentId }: { userId: EmailUserId; mailCollectionsInboxDocumentId: SyncableId }
  ): PR<undefined> => {
    const userFs = await getUserFs(trace, { userId });
    if (!userFs.ok) {
      return userFs;
    }

    const mailFolderId = await MAIL_FOLDER_ID(userFs.value);
    const mailStorageBundleId = await MAIL_STORAGE_BUNDLE_ID(userFs.value);
    const mailCollectionsBundleId = await MAIL_COLLECTIONS_BUNDLE_ID(userFs.value);

    const mailStoragePath = userFs.value.path.append(mailFolderId, mailStorageBundleId);
    const mailIds: MailId[] = [];
    for (const _ of Array.from({ length: 3 })) {
      const mailId = mailIdInfo.make();
      mailIds.push(mailId);
      const createdEmailFile = await createJsonFileAtPath(trace, userFs.value, mailStoragePath.append(prefixedUuidId('file', mailId)), {
        value: {
          id: mailId,
          from: 'test@freedomtechhq.com',
          to: 'test@freedomtechhq.com',
          subject: `Test Email (${mailId})`,
          body: 'This is a test email',
          timeMSec: Date.now()
        },
        schema: storedMailSchema
      });
      if (!createdEmailFile.ok) {
        return generalizeFailureResult(trace, createdEmailFile, [
          'not-found',
          'deleted',
          'wrong-type',
          'conflict',
          'untrusted',
          'format-error'
        ]);
      }
    }

    const inboxPath = userFs.value.path.append(mailFolderId, mailCollectionsBundleId, mailCollectionsInboxDocumentId);
    const inboxDoc = await getMutableConflictFreeDocumentFromBundleAtPath(trace, userFs.value, inboxPath, {
      newDocument: makeMailCollectionDocumentFromSnapshot,
      // TODO: TEMP
      isSnapshotValid: async () => makeSuccess(true),
      // TODO: TEMP
      isDeltaValidForDocument: async () => makeSuccess(true)
    });
    if (!inboxDoc.ok) {
      return generalizeFailureResult(trace, inboxDoc, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    inboxDoc.value.document.mailIds.append(mailIds);
    const savedInboxDoc = await inboxDoc.value.save(trace);
    if (!savedInboxDoc.ok) {
      return generalizeFailureResult(trace, savedInboxDoc, 'conflict');
    }

    return makeSuccess(undefined);
  }
);
