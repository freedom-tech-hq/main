import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { MailId, StoredMail } from 'freedom-email-api';
import { getMailPaths, mailIdInfo, storedMailSchema } from 'freedom-email-api';
import { encName } from 'freedom-sync-types';
import { createJsonFileAtPath, getOrCreateBundlesAtPaths } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

export const addMailToOutbox = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore, mail: StoredMail): PR<{ mailId: MailId }> => {
    const paths = await getMailPaths(syncableStore);

    const mailId = mailIdInfo.make();
    const mailDate = new Date(mailIdInfo.extractTimeMSec(mailId));

    const outYearPath = paths.out.year(mailDate);
    const mailBundle = await getOrCreateBundlesAtPaths(
      trace,
      syncableStore,
      [outYearPath.value, { name: encName(String(mailDate.getUTCFullYear())) }],
      [outYearPath.month.value, { name: encName(String(mailDate.getUTCMonth() + 1)) }],
      [outYearPath.month.day.value, { name: encName(String(mailDate.getUTCDate())) }],
      [outYearPath.month.day.hour.value, { name: encName(String(mailDate.getUTCHours())) }],
      [(await outYearPath.month.day.hour.mailId(mailId)).value, { name: encName(mailId) }]
    );
    if (!mailBundle.ok) {
      return generalizeFailureResult(trace, mailBundle, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    // TODO: should add summary and attachments etc
    const stored = await createJsonFileAtPath(trace, syncableStore, (await outYearPath.month.day.hour.mailId(mailId)).detailed, {
      name: encName('detailed.json'),
      value: mail,
      schema: storedMailSchema
    });
    if (!stored.ok) {
      return generalizeFailureResult(trace, stored, ['conflict', 'deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    return makeSuccess({ mailId });
  }
);
