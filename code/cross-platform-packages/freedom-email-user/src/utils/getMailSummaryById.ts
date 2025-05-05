import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { getMailPaths, type MailId, mailIdInfo, type MailSummary, mailSummarySchema } from 'freedom-email-sync';
import { getJsonFromFile } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

export const getMailSummaryById = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore, mailId: MailId): PR<MailSummary, 'not-found'> => {
    const paths = await getMailPaths(syncableStore);

    const date = new Date(mailIdInfo.extractTimeMSec(mailId));

    const storageYearPath = paths.storage.year(date);
    const mailSummaryPath = (await storageYearPath.month.day.hour.mailId(mailId)).summary;

    const mailSummary = await getJsonFromFile(trace, syncableStore, mailSummaryPath, mailSummarySchema);
    if (!mailSummary.ok) {
      return generalizeFailureResult(trace, mailSummary, ['deleted', 'format-error', 'untrusted', 'wrong-type']);
    }

    return makeSuccess(mailSummary.value);
  }
);
