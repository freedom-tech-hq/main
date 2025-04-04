import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { makePrefixedUuidInfo } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { prefixedUuidId, type StorageRootId } from 'freedom-sync-types';
import { createJsonFileAtPath, saltedId } from 'freedom-syncable-store-types';
import { schema } from 'yaschema';

import { getSyncableStore } from './getSyncableStore.ts';

// TODO: these were copied from email app code and should be in their own package
const MAIL_FOLDER_ID = saltedId('folder', 'mail');
const MAIL_STORAGE_BUNDLE_ID = saltedId('bundle', 'storage');
const mailIdInfo = makePrefixedUuidInfo('MAIL_');
export const storedMailSchema = schema.object({
  id: mailIdInfo.schema,
  from: schema.string(),
  to: schema.string(),
  subject: schema.string(),
  body: schema.string(),
  timeMSec: schema.number()
});

export const addDemoEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { storageRootId }: { storageRootId: StorageRootId }): PR<undefined> => {
    const syncableStore = await uncheckedResult(getSyncableStore(trace, { storageRootId }));

    const mailFolderId = await MAIL_FOLDER_ID(syncableStore.store);
    const mailStorageBundleId = await MAIL_STORAGE_BUNDLE_ID(syncableStore.store);

    const mailStoragePath = syncableStore.store.path.append(mailFolderId, mailStorageBundleId);
    const mailId = mailIdInfo.make();
    const createdEmailFile = await createJsonFileAtPath(
      trace,
      syncableStore.store,
      mailStoragePath.append(prefixedUuidId('file', mailId)),
      {
        value: {
          id: mailId,
          from: 'test@freedomtechhq.com',
          to: 'test@freedomtechhq.com',
          subject: `Test Email (${mailId})`,
          body: 'This is a test email',
          timeMSec: Date.now()
        },
        schema: storedMailSchema
      }
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

    return makeSuccess(undefined);
  }
);
