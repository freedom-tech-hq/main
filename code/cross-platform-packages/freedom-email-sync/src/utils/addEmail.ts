import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { createJsonFileAtPath, getOrCreateBundlesAtPaths } from 'freedom-syncable-store-types';

import type { EmailAccess } from '../types/EmailAccess.ts';
import { type MailId, mailIdInfo } from '../types/MailId.ts';
import { type StoredMail, storedMailSchema } from '../types/StoredMail.ts';
import { getMailPaths } from './getMailPaths.ts';

export const addEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess, mail: StoredMail): PR<{ mailId: MailId }> => {
    const userFs = access.userFs;
    const paths = await getMailPaths(userFs);

    const mailId = mailIdInfo.make();
    const mailDate = new Date(mailIdInfo.extractTimeMSec(mailId));

    const storageYearPath = paths.storage.year(mailDate);
    const currentHourBundle = await getOrCreateBundlesAtPaths(
      trace,
      userFs,
      storageYearPath.value,
      storageYearPath.month.value,
      storageYearPath.month.date.value,
      storageYearPath.month.date.hour.value,
      (await storageYearPath.month.date.hour.mailId(mailId)).value
    );
    if (!currentHourBundle.ok) {
      return generalizeFailureResult(trace, currentHourBundle, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    // TODO: should add summary and attachments etc
    const stored = await createJsonFileAtPath(trace, userFs, (await storageYearPath.month.date.hour.mailId(mailId)).detailed, {
      value: mail,
      schema: storedMailSchema
    });
    if (!stored.ok) {
      return generalizeFailureResult(trace, stored, ['conflict', 'deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    return makeSuccess({ mailId });
  }
);
