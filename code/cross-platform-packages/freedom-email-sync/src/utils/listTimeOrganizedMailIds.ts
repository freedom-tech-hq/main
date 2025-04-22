import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { type PageToken, pageTokenInfo, type Paginated, type PaginationOptions } from 'freedom-paginated-data';
import { extractUnmarkedSyncableId, syncableItemTypes } from 'freedom-sync-types';
import { getBundleAtPath, getSyncableAtPath } from 'freedom-syncable-store';
import { DateTime } from 'luxon';

import type { EmailAccess } from '../types/EmailAccess.ts';
import { type MailId, mailIdInfo } from '../types/MailId.ts';
import type { TimeOrganizedMailStorage } from './getMailPaths.ts';

const TARGET_PAGE_SIZE = 10;

/** Items are in reverse order by time */
export const listTimeOrganizedMailIds = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    access: EmailAccess,
    { timeOrganizedMailStorage, pageToken }: PaginationOptions & { timeOrganizedMailStorage: TimeOrganizedMailStorage }
  ): PR<Paginated<MailId>> => {
    const userFs = access.userFs;

    const cursor = new Date(pageToken !== undefined ? pageTokenInfo.removePrefix(pageToken) : Date.now());
    let cursorYear = cursor.getUTCFullYear();
    let cursorMonth = cursor.getUTCMonth() + 1;
    let cursorDay = cursor.getUTCDate();
    let cursorHour = cursor.getUTCHours();

    const mailIds: MailId[] = [];
    let nextPageToken: PageToken | undefined;
    while (mailIds.length < TARGET_PAGE_SIZE) {
      const basePath = timeOrganizedMailStorage.value;
      const baseYearPath = timeOrganizedMailStorage.year(makeDate(cursorYear, cursorMonth, cursorDay, cursorHour));
      const yearPath = baseYearPath.value;
      const monthPath = baseYearPath.month.value;
      const dayPath = baseYearPath.month.day.value;
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
          nextPageToken = pageTokenInfo.make(DateTime.fromJSDate(cursor).minus({ hour: 1 }).toISO()!);
          break;
        }
      }

      if (cursorHour > 0) {
        const dayBundle = await getBundleAtPath(trace, userFs, dayPath);
        if (!dayBundle.ok) {
          if (dayBundle.value.errorCode !== 'deleted' && dayBundle.value.errorCode !== 'not-found') {
            return generalizeFailureResult(trace, excludeFailureResult(dayBundle, 'deleted', 'not-found'), [
              'format-error',
              'untrusted',
              'wrong-type'
            ]);
          }
        } else {
          const syncableIdsInDay = await dayBundle.value.getIds(trace, { type: 'bundle' });
          if (!syncableIdsInDay.ok) {
            return syncableIdsInDay;
          }

          const previousHourWithContent = syncableIdsInDay.value
            .map((syncableId) => {
              const hour = Number(extractUnmarkedSyncableId(syncableId));
              if (Number.isInteger(hour) && hour >= 0 && hour < cursorHour) {
                return hour;
              } else {
                return undefined;
              }
            })
            .filter((v) => v !== undefined)
            .sort((a, b) => b - a)[0];
          if (previousHourWithContent !== undefined) {
            const endOfNextCursorDay = DateTime.fromObject(
              { year: cursorYear, month: cursorMonth, day: cursorDay, hour: previousHourWithContent },
              { zone: 'UTC' }
            ).endOf('hour');
            cursorHour = endOfNextCursorDay.hour;
            cursorDay = endOfNextCursorDay.day;
            cursorMonth = endOfNextCursorDay.month;
            cursorYear = endOfNextCursorDay.year;
            continue;
          }
        }
      }

      if (cursorDay > 1) {
        const monthBundle = await getBundleAtPath(trace, userFs, monthPath);
        if (!monthBundle.ok) {
          if (monthBundle.value.errorCode !== 'deleted' && monthBundle.value.errorCode !== 'not-found') {
            return generalizeFailureResult(trace, excludeFailureResult(monthBundle, 'deleted', 'not-found'), [
              'format-error',
              'untrusted',
              'wrong-type'
            ]);
          }
        } else {
          const syncableIdsInMonth = await monthBundle.value.getIds(trace, { type: 'bundle' });
          if (!syncableIdsInMonth.ok) {
            return syncableIdsInMonth;
          }

          const previousDayWithContent = syncableIdsInMonth.value
            .map((syncableId) => {
              const day = Number(extractUnmarkedSyncableId(syncableId));
              if (Number.isInteger(day) && day >= 0 && day < cursorDay) {
                return day;
              } else {
                return undefined;
              }
            })
            .filter((v) => v !== undefined)
            .sort((a, b) => b - a)[0];
          if (previousDayWithContent !== undefined) {
            const endOfNextCursorDay = DateTime.fromObject(
              { year: cursorYear, month: cursorMonth, day: previousDayWithContent },
              { zone: 'UTC' }
            ).endOf('day');
            cursorHour = endOfNextCursorDay.hour;
            cursorDay = endOfNextCursorDay.day;
            cursorMonth = endOfNextCursorDay.month;
            cursorYear = endOfNextCursorDay.year;
            continue;
          }
        }
      }

      if (cursorMonth > 1) {
        const yearBundle = await getBundleAtPath(trace, userFs, yearPath);
        if (!yearBundle.ok) {
          if (yearBundle.value.errorCode !== 'deleted' && yearBundle.value.errorCode !== 'not-found') {
            return generalizeFailureResult(trace, excludeFailureResult(yearBundle, 'deleted', 'not-found'), [
              'format-error',
              'untrusted',
              'wrong-type'
            ]);
          }
        } else {
          const syncableIdsInYear = await yearBundle.value.getIds(trace, { type: 'bundle' });
          if (!syncableIdsInYear.ok) {
            return syncableIdsInYear;
          }

          const previousMonthWithContent = syncableIdsInYear.value
            .map((syncableId) => {
              const month = Number(extractUnmarkedSyncableId(syncableId));
              if (Number.isInteger(month) && month >= 0 && month < cursorMonth) {
                return month;
              } else {
                return undefined;
              }
            })
            .filter((v) => v !== undefined)
            .sort((a, b) => b - a)[0];
          if (previousMonthWithContent !== undefined) {
            const endOfNextCursorDay = DateTime.fromObject({ year: cursorYear, month: previousMonthWithContent }, { zone: 'UTC' }).endOf(
              'month'
            );
            cursorHour = endOfNextCursorDay.hour;
            cursorDay = endOfNextCursorDay.day;
            cursorMonth = endOfNextCursorDay.month;
            cursorYear = endOfNextCursorDay.year;
            continue;
          }
        }
      }

      const baseFolderLike = await getSyncableAtPath(trace, userFs, basePath, syncableItemTypes.exclude('file'));
      if (!baseFolderLike.ok) {
        if (baseFolderLike.value.errorCode !== 'deleted' && baseFolderLike.value.errorCode !== 'not-found') {
          return generalizeFailureResult(trace, excludeFailureResult(baseFolderLike, 'deleted', 'not-found'), ['untrusted', 'wrong-type']);
        }
      } else {
        const syncableIdsInBase = await baseFolderLike.value.getIds(trace, { type: 'bundle' });
        if (!syncableIdsInBase.ok) {
          return syncableIdsInBase;
        }

        const previousYearWithContent = syncableIdsInBase.value
          .map((syncableId) => {
            const year = Number(extractUnmarkedSyncableId(syncableId));
            if (Number.isInteger(year) && year >= 0 && year < cursorYear) {
              return year;
            } else {
              return undefined;
            }
          })
          .filter((v) => v !== undefined)
          .sort((a, b) => b - a)[0];
        if (previousYearWithContent !== undefined) {
          const endOfNextCursorDay = DateTime.fromObject({ year: previousYearWithContent }, { zone: 'UTC' }).endOf('year');
          cursorHour = endOfNextCursorDay.hour;
          cursorDay = endOfNextCursorDay.day;
          cursorMonth = endOfNextCursorDay.month;
          cursorYear = endOfNextCursorDay.year;
          continue;
        }
      }

      break;
    }

    return makeSuccess({ items: mailIds, nextPageToken });
  }
);

// Helpers

const makeDate = (year: number, month: number, date: number, hour: number): Date => {
  return new Date(`${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00Z`);
};
