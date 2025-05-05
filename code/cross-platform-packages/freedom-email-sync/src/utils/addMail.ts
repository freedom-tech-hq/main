import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeIsoDateTime } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import { createJsonFileAtPath, getOrCreateBundlesAtPaths } from 'freedom-syncable-store';

import type { EmailAccess } from '../types/EmailAccess.ts';
import { type MailId, mailIdInfo } from '../types/MailId.ts';
import { type StoredMail, storedMailSchema } from '../types/StoredMail.ts';
import { getMailPaths } from './getMailPaths.ts';

export const addMail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess, mail: StoredMail): PR<{ mailId: MailId }> => {
    const userFs = access.userFs;
    const paths = await getMailPaths(userFs);

    const mailId = mailIdInfo.make(`${makeIsoDateTime(new Date(mail.timeMSec))}-${makeUuid()}`);
    const mailDate = new Date(mailIdInfo.extractTimeMSec(mailId));

    const storageYearPath = paths.storage.year(mailDate);
    const mailBundle = await getOrCreateBundlesAtPaths(
      trace,
      userFs,
      storageYearPath.value,
      storageYearPath.month.value,
      storageYearPath.month.day.value,
      storageYearPath.month.day.hour.value,
      (await storageYearPath.month.day.hour.mailId(mailId)).value
    );
    if (!mailBundle.ok) {
      return generalizeFailureResult(trace, mailBundle, ['format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    // TODO: should add summary and attachments etc
    const stored = await createJsonFileAtPath(trace, userFs, (await storageYearPath.month.day.hour.mailId(mailId)).detailed, {
      value: mail,
      schema: storedMailSchema
    });
    if (!stored.ok) {
      return generalizeFailureResult(trace, stored, ['conflict', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    return makeSuccess({ mailId });
  }
);
