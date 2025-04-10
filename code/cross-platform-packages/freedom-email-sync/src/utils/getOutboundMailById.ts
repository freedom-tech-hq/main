import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { getJsonFromFile } from 'freedom-syncable-store-types';

import type { EmailAccess } from '../types/EmailAccess.ts';
import { type MailId, mailIdInfo } from '../types/MailId.ts';
import type { StoredMail } from '../types/StoredMail.ts';
import { storedMailSchema } from '../types/StoredMail.ts';
import { getMailPaths } from './getMailPaths.ts';

export const getOutboundMailById = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess, mailId: MailId): PR<StoredMail, 'not-found'> => {
    const userFs = access.userFs;
    const paths = await getMailPaths(userFs);

    const mailDate = new Date(mailIdInfo.extractTimeMSec(mailId));

    const outYearPath = paths.out.year(mailDate);
    const mailDetailPath = (await outYearPath.month.day.hour.mailId(mailId)).detailed;

    const storedMail = await getJsonFromFile(trace, userFs, mailDetailPath, storedMailSchema);
    if (!storedMail.ok) {
      return generalizeFailureResult(trace, storedMail, ['deleted', 'format-error', 'untrusted', 'wrong-type']);
    }

    return makeSuccess(storedMail.value);
  }
);
