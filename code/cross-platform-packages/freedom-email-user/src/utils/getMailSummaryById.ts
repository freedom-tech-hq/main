import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { type EmailAccess, getMailPaths, type MailId, mailIdInfo, type MailSummary, mailSummarySchema } from 'freedom-email-sync';
import { getJsonFromFile } from 'freedom-syncable-store';

export const getMailSummaryById = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess, mailId: MailId): PR<MailSummary, 'not-found'> => {
    const userFs = access.userFs;
    const paths = await getMailPaths(userFs);

    const date = new Date(mailIdInfo.extractTimeMSec(mailId));

    const storageYearPath = paths.storage.year(date);
    const mailSummaryPath = (await storageYearPath.month.day.hour.mailId(mailId)).summary;

    const mailSummary = await getJsonFromFile(trace, userFs, mailSummaryPath, mailSummarySchema);
    if (!mailSummary.ok) {
      return generalizeFailureResult(trace, mailSummary, ['deleted', 'format-error', 'untrusted', 'wrong-type']);
    }

    return makeSuccess(mailSummary.value);
  }
);
