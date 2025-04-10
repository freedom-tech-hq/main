import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { getMutableBundleAtPath } from 'freedom-syncable-store-types';

import type { EmailAccess } from '../types/EmailAccess.ts';
import { type MailId, mailIdInfo } from '../types/MailId.ts';
import { getMailPaths } from './getMailPaths.ts';

// TODO: there should really be a clean up process to delete empty (as long as they're not current / very close to current) bundles because
// otherwise we'll search through every bundle that's ever been used even though most will be empty

export const deleteOutboundMailById = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess, mailId: MailId): PR<undefined, 'not-found'> => {
    const userFs = access.userFs;
    const paths = await getMailPaths(userFs);

    const mailDate = new Date(mailIdInfo.extractTimeMSec(mailId));

    const outYearPath = paths.out.year(mailDate);
    const hourBundlePath = outYearPath.month.day.hour.value;
    const mailBundlePath = (await outYearPath.month.day.hour.mailId(mailId)).value;

    const hourBundle = await getMutableBundleAtPath(trace, userFs, hourBundlePath);
    if (!hourBundle.ok) {
      return generalizeFailureResult(trace, hourBundle, ['deleted', 'format-error', 'untrusted', 'wrong-type']);
    }

    return await hourBundle.value.delete(trace, mailBundlePath.lastId!);
  }
);
