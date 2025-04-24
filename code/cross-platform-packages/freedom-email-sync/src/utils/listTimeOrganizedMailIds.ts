import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { type PageToken, pageTokenInfo, type Paginated, type PaginationOptions } from 'freedom-paginated-data';
import { extractUnmarkedSyncableId } from 'freedom-sync-types';
import { getBundleAtPath } from 'freedom-syncable-store';
import { DateTime } from 'luxon';

import type { EmailAccess } from '../types/EmailAccess.ts';
import { type MailId, mailIdInfo } from '../types/MailId.ts';
import type { TimeOrganizedMailPaths } from './getMailPaths.ts';
import type { HourTimeObject } from './HourPrecisionTimeUnitValue.ts';
import type { BottomUpMailStorageTraversalResult } from './traverseTimeOrganizedMailStorageFromTheBottomUp.ts';
import { traverseTimeOrganizedMailStorageFromTheBottomUp } from './traverseTimeOrganizedMailStorageFromTheBottomUp.ts';

const TARGET_PAGE_SIZE = 10;

/** Items are in reverse order by time */
export const listTimeOrganizedMailIds = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    access: EmailAccess,
    { timeOrganizedMailStorage, pageToken }: PaginationOptions & { timeOrganizedMailStorage: TimeOrganizedMailPaths }
  ): PR<Paginated<MailId>> => {
    const userFs = access.userFs;

    const offsetDate = new Date(pageToken !== undefined ? pageTokenInfo.removePrefix(pageToken) : Date.now());
    const offset: HourTimeObject = {
      year: offsetDate.getUTCFullYear(),
      month: offsetDate.getUTCMonth() + 1,
      day: offsetDate.getUTCDate(),
      hour: offsetDate.getUTCHours()
    };

    const mailIds: MailId[] = [];
    let nextPageToken: PageToken | undefined;
    const traversed = await traverseTimeOrganizedMailStorageFromTheBottomUp(
      trace,
      access,
      {
        timeOrganizedMailStorage,
        offset
      },
      async (trace, cursor): PR<BottomUpMailStorageTraversalResult> => {
        if (cursor.type !== 'hour') {
          return makeSuccess('inspect' as const);
        }

        const baseYearPath = timeOrganizedMailStorage.year(
          makeDate(cursor.value.year, cursor.value.month, cursor.value.day, cursor.value.hour)
        );
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
        } else {
          const syncableIdsInHour = await hourBundle.value.getIds(trace, { type: 'bundle' });
          if (!syncableIdsInHour.ok) {
            return syncableIdsInHour;
          }

          const mailIdsInHour = syncableIdsInHour.value
            .map((syncableId) => mailIdInfo.checked(extractUnmarkedSyncableId(syncableId)))
            .filter((v) => v !== undefined)
            .sort()
            .reverse();
          mailIds.push(...mailIdsInHour);

          if (mailIds.length >= TARGET_PAGE_SIZE) {
            nextPageToken = pageTokenInfo.make(DateTime.fromObject(cursor.value, { zone: 'UTC' }).minus({ hour: 1 }).toISO()!);
            return makeSuccess('stop' as const);
          }
        }

        return makeSuccess('skip' as const);
      }
    );
    if (!traversed.ok) {
      return traversed;
    }

    return makeSuccess({ items: mailIds, nextPageToken });
  }
);

// Helpers

const makeDate = (year: number, month: number, date: number, hour: number): Date => {
  return new Date(`${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00Z`);
};
