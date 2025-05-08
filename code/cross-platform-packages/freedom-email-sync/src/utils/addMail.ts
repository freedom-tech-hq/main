import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeIsoDateTime } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import { encName } from 'freedom-sync-types';
import { createJsonFileAtPath, getOrCreateBundlesAtPaths } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { type MailId, mailIdInfo } from '../types/MailId.ts';
import { type StoredMail, storedMailSchema } from '../types/StoredMail.ts';
import { getMailPaths } from './getMailPaths.ts';

export const addMail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, syncableStore: MutableSyncableStore, mail: StoredMail): PR<{ mailId: MailId }> => {
    const paths = await getMailPaths(syncableStore);

    const mailId = mailIdInfo.make(`${makeIsoDateTime(new Date(mail.timeMSec))}-${makeUuid()}`);
    const mailDate = new Date(mailIdInfo.extractTimeMSec(mailId));

    const storageYearPath = paths.storage.year(mailDate);
    const mailBundle = await getOrCreateBundlesAtPaths(
      trace,
      syncableStore,
      [storageYearPath.value, { name: encName(String(mailDate.getUTCFullYear())) }],
      [storageYearPath.month.value, { name: encName(String(mailDate.getUTCMonth() + 1)) }],
      [storageYearPath.month.day.value, { name: encName(String(mailDate.getUTCDate())) }],
      [storageYearPath.month.day.hour.value, { name: encName(String(mailDate.getUTCHours())) }],
      [(await storageYearPath.month.day.hour.mailId(mailId)).value, { name: encName(mailId) }]
    );
    if (!mailBundle.ok) {
      return generalizeFailureResult(trace, mailBundle, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }

    // TODO: should add summary and attachments etc
    const stored = await createJsonFileAtPath(trace, syncableStore, (await storageYearPath.month.day.hour.mailId(mailId)).detailed, {
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
