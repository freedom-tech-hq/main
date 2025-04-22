import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailAccess, MailId, StoredMail } from 'freedom-email-sync';
import { getMailPaths, mailIdInfo, storedMailSchema } from 'freedom-email-sync';
import { createJsonFileAtPath, getOrCreateBundlesAtPaths } from 'freedom-syncable-store';

export const addMailToOutbox = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess, mail: StoredMail): PR<{ mailId: MailId }> => {
    const userFs = access.userFs;
    const paths = await getMailPaths(userFs);

    const mailId = mailIdInfo.make();
    const mailDate = new Date(mailIdInfo.extractTimeMSec(mailId));

    const outYearPath = paths.out.year(mailDate);
    const mailBundle = await getOrCreateBundlesAtPaths(
      trace,
      userFs,
      outYearPath.value,
      outYearPath.month.value,
      outYearPath.month.day.value,
      outYearPath.month.day.hour.value,
      (await outYearPath.month.day.hour.mailId(mailId)).value
    );
    if (!mailBundle.ok) {
      return generalizeFailureResult(trace, mailBundle, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    // TODO: should add summary and attachments etc
    const stored = await createJsonFileAtPath(trace, userFs, (await outYearPath.month.day.hour.mailId(mailId)).detailed, {
      value: mail,
      schema: storedMailSchema
    });
    if (!stored.ok) {
      return generalizeFailureResult(trace, stored, ['conflict', 'deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    return makeSuccess({ mailId });
  }
);
