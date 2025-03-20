import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import { encId } from 'freedom-sync-types';
import { createJsonFileAtPath, getMutableConflictFreeDocumentFromBundleAtPath } from 'freedom-syncable-store-types';

import { mailIdInfo } from '../../../../modules/mail-types/MailId.js';
import type { EmailUserId } from '../../../../types/EmailUserId.js';
import {
  MAIL_COLLECTIONS_BUNDLE_ID,
  MAIL_COLLECTIONS_INBOX_DOCUMENT_ID,
  MAIL_FOLDER_ID,
  MAIL_STORAGE_BUNDLE_ID
} from '../../../consts/user-syncable-paths.js';
import { makeMailCollectionDocumentFromSnapshot } from '../../../types/MailCollectionDocument.js';
import { storedMailSchema } from '../../../types/StoredMail.js';
import { getUserFs } from '../storage/getUserFs.js';

// TODO: remove once services are available
export const createInitialMockContentForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<undefined> => {
    const userFs = await getUserFs(trace, { userId });
    if (!userFs.ok) {
      return userFs;
    }

    const mailStoragePath = userFs.value.path.dynamic.append(MAIL_FOLDER_ID, MAIL_STORAGE_BUNDLE_ID);
    const id = mailIdInfo.make(makeUuid());
    const createdEmailFile = await createJsonFileAtPath(
      trace,
      userFs.value,
      mailStoragePath,
      encId(id),
      {
        id,
        from: 'test@freedomtechhq.com',
        to: 'test@freedomtechhq.com',
        subject: 'Test Email',
        body: 'This is a test email',
        timeMSec: Date.now()
      },
      storedMailSchema
    );
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
    const syncableId = createdEmailFile.value.path.lastId!;

    const inboxPath = userFs.value.path.dynamic.append(MAIL_FOLDER_ID, MAIL_COLLECTIONS_BUNDLE_ID, MAIL_COLLECTIONS_INBOX_DOCUMENT_ID);
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

    inboxDoc.value.document.syncableMailIds.append([syncableId]);
    const savedInboxDoc = await inboxDoc.value.save(trace);
    if (!savedInboxDoc.ok) {
      return generalizeFailureResult(trace, savedInboxDoc, 'conflict');
    }

    return makeSuccess(undefined);
  }
);
