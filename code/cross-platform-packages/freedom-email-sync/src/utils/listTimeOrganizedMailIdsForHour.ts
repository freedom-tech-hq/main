import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractUnmarkedSyncableId } from 'freedom-sync-types';
import { getBundleAtPath } from 'freedom-syncable-store';
import { DateTime } from 'luxon';

import type { EmailAccess } from '../types/EmailAccess.ts';
import { type MailId, mailIdInfo } from '../types/MailId.ts';
import type { TimeOrganizedMailPaths } from './getMailPaths.ts';
import type { HourTimeObject } from './HourPrecisionTimeUnitValue.ts';

/** Items are in reverse order by time */
export const listTimeOrganizedMailIdsForHour = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    access: EmailAccess,
    {
      timeOrganizedMailStorage,
      hour
    }: {
      timeOrganizedMailStorage: TimeOrganizedMailPaths;
      hour: HourTimeObject;
    }
  ): PR<MailId[]> => {
    const userFs = access.userFs;

    const date = DateTime.fromObject(hour, { zone: 'UTC' }).toJSDate();

    const baseYearPath = timeOrganizedMailStorage.year(date);
    const hourPath = baseYearPath.month.day.hour.value;

    const hourBundle = await getBundleAtPath(trace, userFs, hourPath);
    if (!hourBundle.ok) {
      if (hourBundle.value.errorCode !== 'deleted' && hourBundle.value.errorCode !== 'not-found') {
        return generalizeFailureResult(trace, excludeFailureResult(hourBundle, 'deleted', 'not-found'), [
          'format-error',
          'untrusted',
          'wrong-type'
        ]);
      }

      return makeSuccess([]);
    } else {
      const syncableIdsInHour = await hourBundle.value.getIds(trace, { type: 'bundle' });
      if (!syncableIdsInHour.ok) {
        return syncableIdsInHour;
      }

      const mailIds = syncableIdsInHour.value
        .map((syncableId) => mailIdInfo.checked(extractUnmarkedSyncableId(syncableId)))
        .filter((v) => v !== undefined)
        .sort()
        .reverse();
      return makeSuccess(mailIds);
    }
  }
);
