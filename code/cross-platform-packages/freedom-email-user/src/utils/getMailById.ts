import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { MailId, StoredMail } from 'freedom-email-sync';
import { getMailPaths, mailIdInfo, storedMailSchema } from 'freedom-email-sync';
import { getJsonFromFile } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

export const getMailById = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore, mailId: MailId): PR<StoredMail, 'not-found'> => {
    const paths = await getMailPaths(syncableStore);

    const date = new Date(mailIdInfo.extractTimeMSec(mailId));

    const storageYearPath = paths.storage.year(date);
    const mailDetailedPath = (await storageYearPath.month.day.hour.mailId(mailId)).detailed;

    const mail = await getJsonFromFile(trace, syncableStore, mailDetailedPath, storedMailSchema);
    if (!mail.ok) {
      return generalizeFailureResult(trace, mail, ['deleted', 'format-error', 'untrusted', 'wrong-type']);
    }

    return makeSuccess(mail.value);
  }
);
