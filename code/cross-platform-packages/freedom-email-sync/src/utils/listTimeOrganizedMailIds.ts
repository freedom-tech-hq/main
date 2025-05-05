import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { Nested } from 'freedom-nest';
import { type PageToken, pageTokenInfo, type Paginated, type PaginationOptions } from 'freedom-paginated-data';
import type { SyncableId, SyncablePath } from 'freedom-sync-types';
import { extractUnmarkedSyncableId } from 'freedom-sync-types';
import { getBundleAtPath } from 'freedom-syncable-store';
import type { MutableSyncableStore, SaltedId } from 'freedom-syncable-store-types';
import { DateTime } from 'luxon';

import { type MailId, mailIdInfo } from '../types/MailId.ts';
import type { TimeOrganizedPaths } from './getMailPaths.ts';
import type { HourTimeObject } from './HourPrecisionTimeUnitValue.ts';
import type { BottomUpMailStorageTraversalResult } from './traverseTimeOrganizedMailStorageFromTheBottomUp.ts';
import { traverseTimeOrganizedMailStorageFromTheBottomUp } from './traverseTimeOrganizedMailStorageFromTheBottomUp.ts';

const TARGET_PAGE_SIZE = 10;

/** Items are in reverse order by time */
export const listTimeOrganizedMailIds = makeAsyncResultFunc(
  [import.meta.filename],
  async <
    IdT extends SaltedId | SyncableId,
    YearIdsT extends object,
    MonthIdsT extends object,
    DayIdsT extends object,
    HourIdsT extends object,
    YearContentT extends object,
    MonthContentT extends object,
    DayContentT extends object,
    HourContentT extends object
  >(
    trace: Trace,
    syncableStore: MutableSyncableStore,
    {
      timeOrganizedPaths,
      pageToken
    }: PaginationOptions & {
      timeOrganizedPaths: Nested<
        SyncablePath,
        TimeOrganizedPaths<IdT, YearIdsT, MonthIdsT, DayIdsT, HourIdsT, YearContentT, MonthContentT, DayContentT, HourContentT>
      >;
    }
  ): PR<Paginated<MailId>> => {
    const offsetDate = new Date(pageToken !== undefined ? pageTokenInfo.removePrefix(pageToken) : Date.now());
    const offset: HourTimeObject = {
      year: offsetDate.getUTCFullYear(),
      month: offsetDate.getUTCMonth() + 1,
      day: offsetDate.getUTCDate(),
      hour: offsetDate.getUTCHours()
    };

    const pageContent: MailId[] = [];
    let nextPageToken: PageToken | undefined;
    const traversed = await traverseTimeOrganizedMailStorageFromTheBottomUp(
      trace,
      syncableStore,
      {
        timeOrganizedPaths,
        offset
      },
      async (trace, cursor): PR<BottomUpMailStorageTraversalResult> => {
        if (cursor.type !== 'hour') {
          return makeSuccess('inspect' as const);
        }

        const baseYearPath = timeOrganizedPaths.year(makeDate(cursor.value.year, cursor.value.month, cursor.value.day, cursor.value.hour));
        const hourPath = baseYearPath.month.day.hour.value;

        const hourBundle = await getBundleAtPath(trace, syncableStore, hourPath);
        if (!hourBundle.ok) {
          if (hourBundle.value.errorCode !== 'not-found') {
            return generalizeFailureResult(trace, excludeFailureResult(hourBundle, 'not-found'), [
              'format-error',
              'untrusted',
              'wrong-type'
            ]);
          }
        } else {
          const syncableIdsInHour = await hourBundle.value.getIds(trace);
          if (!syncableIdsInHour.ok) {
            return syncableIdsInHour;
          }

          const mailIdsInHour = syncableIdsInHour.value.map(extractUnmarkedSyncableId).filter(mailIdInfo.is).sort().reverse();
          pageContent.push(...mailIdsInHour);

          if (pageContent.length >= TARGET_PAGE_SIZE) {
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

    return makeSuccess({ items: pageContent, nextPageToken });
  }
);

// Helpers

const makeDate = (year: number, month: number, date: number, hour: number): Date => {
  return new Date(`${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00Z`);
};
