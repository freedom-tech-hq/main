import type { Uuid } from 'freedom-basic-data';
import { nest } from 'freedom-nest';
import type { SyncableId } from 'freedom-sync-types';
import { plainId, prefixedUuidId, uuidId } from 'freedom-sync-types';
import type { SaltedId } from 'freedom-syncable-store-types';
import { saltedId } from 'freedom-syncable-store-types';

import type { MailId } from '../types/MailId.ts';

// These are share with the server

export const makeTimeOrganizedIds = <YearT extends object, MonthT extends object, DayT extends object, HourT extends object>({
  yearContent,
  monthContent,
  dayContent,
  hourContent
}: {
  yearContent: YearT;
  monthContent: MonthT;
  dayContent: DayT;
  hourContent: HourT;
}) => ({
  year: nest(({ year }: { year: number }): SyncableId => plainId('bundle', `${year}`), {
    ...yearContent,
    month: nest(({ month }: { month: number }): SyncableId => plainId('bundle', `${month}`), {
      ...monthContent,
      day: nest(({ day }: { day: number }): SyncableId => plainId('bundle', `${day}`), {
        ...dayContent,
        hour: nest(({ hour }: { hour: number }): SyncableId => plainId('bundle', `${hour}`), { ...hourContent })
      })
    })
  })
});

export type TimeOrganizedIds<YearT extends object, MonthT extends object, DayT extends object, HourT extends object> = ReturnType<
  typeof makeTimeOrganizedIds<YearT, MonthT, DayT, HourT>
>;

const storedMailIds = {
  mailId: nest((mailId: MailId): SyncableId => prefixedUuidId('bundle', mailId), {
    summary: saltedId('file', 'summary.json'),
    detailed: saltedId('file', 'detailed.json'),
    attachments: nest(saltedId('bundle', 'attachments'), {
      attachmentId: nest((uuid?: Uuid): SyncableId => uuidId('bundle', uuid), {
        chunkId: (chunkNumber: number): SaltedId => saltedId('file', `chunk-${chunkNumber}`)
      })
    })
  })
};
export type StoredMailIds = typeof storedMailIds;

const timeOrganizedMailIds = makeTimeOrganizedIds({
  yearContent: {},
  monthContent: {},
  dayContent: {},
  hourContent: storedMailIds
});

export type TimeOrganizedMailIds = typeof timeOrganizedMailIds;

/** Server gets append-only access */
const storage = nest<SaltedId, TimeOrganizedMailIds>(saltedId('folder', 'storage'), timeOrganizedMailIds);

/** Server gets read-write access */
const out = nest(saltedId('folder', 'out'), timeOrganizedMailIds);

/** See SYNCABLE_MAIL_STORAGE.md */
export const mailSyncableIds = { storage, out };
