import type { PR, PRFunc } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { Nested } from 'freedom-nest';
import type { SyncableId, SyncablePath } from 'freedom-sync-types';
import { folderLikeSyncableItemTypes } from 'freedom-sync-types';
import { getSyncableAtPath } from 'freedom-syncable-store';
import type { MutableSyncableStore, SaltedId } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import { DateTime } from 'luxon';

import { extractNumberFromPlainSyncableId } from './extractNumberFromPlainSyncableId.ts';
import type { TimeOrganizedPaths } from './getMailPaths.ts';
import type { HourOrLessPrecisionValue, HourOrLessTimeObject } from './HourPrecisionTimeUnitValue.ts';

export type TimeOrganizedMailStorageTraverserAccessor = HourOrLessPrecisionValue & {
  previous: PRFunc<TimeOrganizedMailStorageTraverserAccessor | undefined>;
  inside: PRFunc<TimeOrganizedMailStorageTraverserAccessor | undefined>;
};

/**
 * Returns the newest year with content and then provides methods for:
 * - getting the previous year with content
 * - getting the newest month with content in that year
 *
 * and recursively the same for month, day and hour.
 *
 * If there is no content, it returns `undefined`.
 */
export const makeBottomUpTimeOrganizedMailStorageTraverser = makeAsyncResultFunc(
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
      offset
    }: {
      timeOrganizedPaths: Nested<
        SyncablePath,
        TimeOrganizedPaths<IdT, YearIdsT, MonthIdsT, DayIdsT, HourIdsT, YearContentT, MonthContentT, DayContentT, HourContentT>
      >;
      offset?: HourOrLessTimeObject;
    }
  ): PR<TimeOrganizedMailStorageTraverserAccessor | undefined> => {
    const offsetYear = offset?.year;
    const offsetMonth = offset?.month;
    const offsetDay = offset?.day;
    const offsetHour = offset?.hour;

    const getSameOrPreviousYear = makeAsyncResultFunc(
      [import.meta.filename, 'getSameOrPreviousYear'],
      async (trace, cursorYear: number): PR<TimeOrganizedMailStorageTraverserAccessor | undefined> => {
        const baseFolderLike = await disableLam('not-found', getSyncableAtPath)(
          trace,
          syncableStore,
          timeOrganizedPaths.value,
          folderLikeSyncableItemTypes
        );
        if (!baseFolderLike.ok) {
          if (baseFolderLike.value.errorCode === 'not-found') {
            return makeSuccess(undefined);
          }

          return generalizeFailureResult(trace, excludeFailureResult(baseFolderLike, 'not-found'), ['untrusted', 'wrong-type']);
        }

        const syncableIdsInBase = await baseFolderLike.value.getIds(trace, { type: 'bundle' });
        if (!syncableIdsInBase.ok) {
          return syncableIdsInBase;
        }

        const sameOrPreviousYearWithContent = syncableIdsInBase.value
          .map((syncableId) => {
            const year = extractNumberFromPlainSyncableId(syncableId);
            if (year !== undefined && year >= 0 && year <= cursorYear) {
              return year;
            } else {
              return undefined;
            }
          })
          .filter((v) => v !== undefined)
          .sort((a, b) => b - a)[0];
        if (sameOrPreviousYearWithContent === undefined) {
          return makeSuccess(undefined);
        }

        return makeSuccess({
          type: 'year' as const,
          value: { year: sameOrPreviousYearWithContent },
          previous: makeAsyncResultFunc(
            [import.meta.filename, 'getSameOrPreviousYear', 'previous'],
            async (trace) => await getSameOrPreviousYear(trace, sameOrPreviousYearWithContent - 1)
          ),
          inside: makeAsyncResultFunc([import.meta.filename, 'getSameOrPreviousYear', 'inside'], async (trace) => {
            const endOfYear = DateTime.fromObject({ year: sameOrPreviousYearWithContent }, { zone: 'UTC' }).endOf('year');
            return await getSameOrPreviousMonth(trace, sameOrPreviousYearWithContent, endOfYear.month);
          })
        });
      }
    );

    const getSameOrPreviousMonth = makeAsyncResultFunc(
      [import.meta.filename, 'getSameOrPreviousMonth'],
      async (trace, cursorYear: number, cursorMonth: number): PR<TimeOrganizedMailStorageTraverserAccessor | undefined> => {
        if (cursorMonth <= 0) {
          return makeSuccess(undefined);
        }

        const baseYearPath = timeOrganizedPaths.year(makeDate(cursorYear, 1, 1, 0));
        const yearPath = baseYearPath.value;

        const yearBundle = await disableLam('not-found', getSyncableAtPath)(trace, syncableStore, yearPath, 'bundle');
        if (!yearBundle.ok) {
          if (yearBundle.value.errorCode === 'not-found') {
            return makeSuccess(undefined);
          }

          return generalizeFailureResult(trace, excludeFailureResult(yearBundle, 'not-found'), ['untrusted', 'wrong-type']);
        }

        const syncableIdsInYear = await yearBundle.value.getIds(trace, { type: 'bundle' });
        if (!syncableIdsInYear.ok) {
          return syncableIdsInYear;
        }

        const sameOrPreviousMonthWithContent = syncableIdsInYear.value
          .map((syncableId) => {
            const month = extractNumberFromPlainSyncableId(syncableId);
            if (
              month !== undefined &&
              month >= 0 &&
              month <= cursorMonth &&
              (cursorYear !== offsetYear || offsetMonth === undefined || month <= offsetMonth)
            ) {
              return month;
            } else {
              return undefined;
            }
          })
          .filter((v) => v !== undefined)
          .sort((a, b) => b - a)[0];
        if (sameOrPreviousMonthWithContent === undefined) {
          return makeSuccess(undefined);
        }

        return makeSuccess({
          type: 'month' as const,
          value: { year: cursorYear, month: sameOrPreviousMonthWithContent },
          previous: makeAsyncResultFunc(
            [import.meta.filename, 'getSameOrPreviousMonth', 'previous'],
            async (trace) => await getSameOrPreviousMonth(trace, cursorYear, sameOrPreviousMonthWithContent - 1)
          ),
          inside: makeAsyncResultFunc([import.meta.filename, 'getSameOrPreviousMonth', 'inside'], async (trace) => {
            const endOfMonth = DateTime.fromObject({ year: cursorYear, month: sameOrPreviousMonthWithContent }, { zone: 'UTC' }).endOf(
              'month'
            );
            return await getSameOrPreviousDay(trace, cursorYear, sameOrPreviousMonthWithContent, endOfMonth.day);
          })
        });
      }
    );

    const getSameOrPreviousDay = makeAsyncResultFunc(
      [import.meta.filename, 'getSameOrPreviousDay'],
      async (
        trace,
        cursorYear: number,
        cursorMonth: number,
        cursorDay: number
      ): PR<TimeOrganizedMailStorageTraverserAccessor | undefined> => {
        if (cursorDay <= 0) {
          return makeSuccess(undefined);
        }

        const baseYearPath = timeOrganizedPaths.year(makeDate(cursorYear, cursorMonth, 1, 0));
        const monthPath = baseYearPath.month.value;

        const monthBundle = await disableLam('not-found', getSyncableAtPath)(trace, syncableStore, monthPath, 'bundle');
        if (!monthBundle.ok) {
          if (monthBundle.value.errorCode === 'not-found') {
            return makeSuccess(undefined);
          }

          return generalizeFailureResult(trace, excludeFailureResult(monthBundle, 'not-found'), ['untrusted', 'wrong-type']);
        }

        const syncableIdsInMonth = await monthBundle.value.getIds(trace, { type: 'bundle' });
        if (!syncableIdsInMonth.ok) {
          return syncableIdsInMonth;
        }

        const sameOrPreviousDayWithContent = syncableIdsInMonth.value
          .map((syncableId) => {
            const day = extractNumberFromPlainSyncableId(syncableId);
            if (
              day !== undefined &&
              day >= 0 &&
              day <= cursorDay &&
              (cursorYear !== offsetYear || cursorMonth !== offsetMonth || offsetDay === undefined || day <= offsetDay)
            ) {
              return day;
            } else {
              return undefined;
            }
          })
          .filter((v) => v !== undefined)
          .sort((a, b) => b - a)[0];
        if (sameOrPreviousDayWithContent === undefined) {
          return makeSuccess(undefined);
        }

        return makeSuccess({
          type: 'day' as const,
          value: { year: cursorYear, month: cursorMonth, day: sameOrPreviousDayWithContent },
          previous: makeAsyncResultFunc(
            [import.meta.filename, 'getSameOrPreviousDay', 'previous'],
            async (trace) => await getSameOrPreviousDay(trace, cursorYear, cursorMonth, sameOrPreviousDayWithContent - 1)
          ),
          inside: makeAsyncResultFunc([import.meta.filename, 'getSameOrPreviousDay', 'inside'], async (trace) => {
            const endOfDay = DateTime.fromObject(
              { year: cursorYear, month: cursorMonth, day: sameOrPreviousDayWithContent },
              { zone: 'UTC' }
            ).endOf('day');
            return await getSameOrPreviousHour(trace, cursorYear, cursorMonth, sameOrPreviousDayWithContent, endOfDay.hour);
          })
        });
      }
    );

    const getSameOrPreviousHour = makeAsyncResultFunc(
      [import.meta.filename, 'getSameOrPreviousHour'],
      async (
        trace,
        cursorYear: number,
        cursorMonth: number,
        cursorDay: number,
        cursorHour: number
      ): PR<TimeOrganizedMailStorageTraverserAccessor | undefined> => {
        if (cursorHour < 0) {
          return makeSuccess(undefined);
        }

        const baseYearPath = timeOrganizedPaths.year(makeDate(cursorYear, cursorMonth, cursorDay, 0));
        const dayPath = baseYearPath.month.day.value;

        const dayBundle = await disableLam('not-found', getSyncableAtPath)(trace, syncableStore, dayPath, 'bundle');
        if (!dayBundle.ok) {
          if (dayBundle.value.errorCode === 'not-found') {
            return makeSuccess(undefined);
          }

          return generalizeFailureResult(trace, excludeFailureResult(dayBundle, 'not-found'), ['untrusted', 'wrong-type']);
        }

        const syncableIdsInDay = await dayBundle.value.getIds(trace, { type: 'bundle' });
        if (!syncableIdsInDay.ok) {
          return syncableIdsInDay;
        }

        const sameOrPreviousHourWithContent = syncableIdsInDay.value
          .map((syncableId) => {
            const hour = extractNumberFromPlainSyncableId(syncableId);
            if (
              hour !== undefined &&
              hour >= 0 &&
              hour <= cursorHour &&
              (cursorYear !== offsetYear ||
                cursorMonth !== offsetMonth ||
                cursorDay !== offsetDay ||
                offsetHour === undefined ||
                hour <= offsetHour)
            ) {
              return hour;
            } else {
              return undefined;
            }
          })
          .filter((v) => v !== undefined)
          .sort((a, b) => b - a)[0];
        if (sameOrPreviousHourWithContent === undefined) {
          return makeSuccess(undefined);
        }

        return makeSuccess({
          type: 'hour' as const,
          value: { year: cursorYear, month: cursorMonth, day: cursorDay, hour: sameOrPreviousHourWithContent },
          previous: makeAsyncResultFunc(
            [import.meta.filename, 'getSameOrPreviousHour', 'previous'],
            async (trace) => await getSameOrPreviousHour(trace, cursorYear, cursorMonth, cursorDay, sameOrPreviousHourWithContent - 1)
          ),
          inside: makeAsyncResultFunc([import.meta.filename, 'getSameOrPreviousHour', 'inside'], async (_trace) => makeSuccess(undefined))
        });
      }
    );

    return await getSameOrPreviousYear(trace, offsetYear ?? new Date().getUTCFullYear());
  }
);

// Helpers

const makeDate = (year: number, month: number, date: number, hour: number): Date => {
  return new Date(`${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00Z`);
};
