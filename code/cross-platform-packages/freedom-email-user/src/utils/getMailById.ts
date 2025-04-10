import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailAccess, MailId, StoredMail } from 'freedom-email-sync';
import { getMailPaths, mailIdInfo, storedMailSchema } from 'freedom-email-sync';
import { getJsonFromFile } from 'freedom-syncable-store-types';

export const getMailById = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess, mailId: MailId): PR<StoredMail, 'not-found'> => {
    const userFs = access.userFs;
    const paths = await getMailPaths(userFs);

    const date = new Date(mailIdInfo.extractTimeMSec(mailId));

    const storageYearPath = paths.storage.year(date);
    const mailDetailedPath = (await storageYearPath.month.day.hour.mailId(mailId)).detailed;

    const mail = await getJsonFromFile(trace, userFs, mailDetailedPath, storedMailSchema);
    if (!mail.ok) {
      return generalizeFailureResult(trace, mail, ['deleted', 'format-error', 'untrusted', 'wrong-type']);
    }

    return makeSuccess(mail.value);
  }
);
