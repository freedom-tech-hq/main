import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { getJsonFromFile } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { type MailId, mailIdInfo } from '../types/MailId.ts';
import type { StoredMail } from '../types/StoredMail.ts';
import { storedMailSchema } from '../types/StoredMail.ts';
import { getMailPaths } from './getMailPaths.ts';

export const getOutboundMailById = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore, mailId: MailId): PR<StoredMail, 'not-found'> => {
    const paths = await getMailPaths(syncableStore);

    const mailDate = new Date(mailIdInfo.extractTimeMSec(mailId));

    const outYearPath = paths.out.year(mailDate);
    const mailDetailPath = (await outYearPath.month.day.hour.mailId(mailId)).detailed;

    const storedMail = await getJsonFromFile(trace, syncableStore, mailDetailPath, storedMailSchema);
    if (!storedMail.ok) {
      return generalizeFailureResult(trace, storedMail, ['deleted', 'format-error', 'untrusted', 'wrong-type']);
    }

    return makeSuccess(storedMail.value);
  }
);
