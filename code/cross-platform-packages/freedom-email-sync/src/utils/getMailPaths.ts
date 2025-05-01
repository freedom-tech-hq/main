import type { Uuid } from 'freedom-basic-data';
import type { Nested } from 'freedom-nest';
import { nest } from 'freedom-nest';
import type { SyncableId, SyncablePath } from 'freedom-sync-types';
import type { SaltedId, SyncableStore } from 'freedom-syncable-store-types';

import type { StoredMailIds, TimeOrganizedIds, TimeOrganizedMailIds } from '../consts/mailSyncableIds.ts';
import { mailSyncableIds } from '../consts/mailSyncableIds.ts';
import type { MailId } from '../types/MailId.ts';

const globalCache = new WeakMap<SyncableStore, MailPaths>();

export const getMailPaths = async (userFs: SyncableStore) => {
  const cached = globalCache.get(userFs);
  if (cached !== undefined) {
    return cached;
  }

  const newValue = await internalGetMailPaths(userFs);
  globalCache.set(userFs, newValue);
  return newValue;
};

export type MailPaths = Awaited<ReturnType<typeof internalGetMailPaths>>;

export type TimeOrganizedMailPaths<IdT extends SaltedId | SyncableId = SaltedId | SyncableId> = Nested<
  SyncablePath,
  ReturnType<typeof makeTimeOrganizedMailPaths<IdT>>
>;

// Helpers

const internalGetMailPaths = async (userFs: SyncableStore) =>
  await nest(userFs.path, async (rootPath) => ({
    storage: await nest(
      [mailSyncableIds.storage],
      async (id) => rootPath.append(await id.value(userFs)),
      (parentPath, parentId: Nested<SaltedId, TimeOrganizedMailIds>) => makeTimeOrganizedMailPaths(userFs, parentPath, parentId)
    ),
    out: await nest(
      [mailSyncableIds.out],
      async (id) => rootPath.append(await id.value(userFs)),
      (parentPath, parentId) => makeTimeOrganizedMailPaths(userFs, parentPath, parentId)
    )
  }));

const makeStoredMailPaths = (userFs: SyncableStore, parentPath: SyncablePath, parentId: StoredMailIds) => ({
  mailId: (mailId: MailId) =>
    nest(
      [parentId.mailId],
      (id): SyncablePath => parentPath.append(id.value(mailId)),
      async (parentPath, parentId) => ({
        summary: parentPath.append(await parentId.summary(userFs)),
        detailed: parentPath.append(await parentId.detailed(userFs)),
        attachments: nest(
          [parentId.attachments],
          async (id): Promise<SyncablePath> => parentPath.append(await id.value(userFs)),
          (parentPath, parentId) => ({
            attachmentId: async (uuid?: Uuid) =>
              await nest(
                [parentId.attachmentId],
                (id): SyncablePath => parentPath.append(id.value(uuid)),
                async (parentPath, parentId) => ({
                  chunkId: async (chunkNumber: number): Promise<SyncablePath> =>
                    parentPath.append(await parentId.chunkId(chunkNumber)(userFs))
                })
              )
          })
        )
      })
    )
});

export type StoredMailPaths = ReturnType<typeof makeStoredMailPaths>;

export const makeTimeOrganizedPaths = <
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
  parentPath: SyncablePath,
  parentId: Nested<IdT, TimeOrganizedIds<YearIdsT, MonthIdsT, DayIdsT, HourIdsT>>,
  {
    yearContent,
    monthContent,
    dayContent,
    hourContent
  }: {
    yearContent: (parentPath: SyncablePath, parentId: Nested<(args: { year: number }) => SyncableId, YearIdsT>) => YearContentT;
    monthContent: (parentPath: SyncablePath, parentId: Nested<(args: { month: number }) => SyncableId, MonthIdsT>) => MonthContentT;
    dayContent: (parentPath: SyncablePath, parentId: Nested<(args: { day: number }) => SyncableId, DayIdsT>) => DayContentT;
    hourContent: (parentPath: SyncablePath, parentId: Nested<(args: { hour: number }) => SyncableId, HourIdsT>) => HourContentT;
  }
) => ({
  year: (date: Date) =>
    nest(
      [parentId.year],
      (id): SyncablePath => parentPath.append(id.value({ year: date.getUTCFullYear() })),
      (parentPath, parentId) => ({
        ...yearContent?.(parentPath, parentId as any as Nested<(args: { year: number }) => SyncableId, YearIdsT>),
        month: nest(
          [parentId.month],
          (id): SyncablePath => parentPath.append(id.value({ month: date.getUTCMonth() + 1 })),
          (parentPath, parentId) => ({
            ...monthContent?.(parentPath, parentId as any as Nested<(args: { month: number }) => SyncableId, MonthIdsT>),
            day: nest(
              [parentId.day],
              (id): SyncablePath => parentPath.append(id.value({ day: date.getUTCDate() })),
              (parentPath, parentId) => ({
                ...dayContent?.(parentPath, parentId as any as Nested<(args: { day: number }) => SyncableId, DayIdsT>),
                hour: nest(
                  [parentId.hour],
                  (id): SyncablePath => parentPath.append(id.value({ hour: date.getUTCHours() })),
                  (parentPath, parentId) => ({
                    ...hourContent?.(parentPath, parentId as any as Nested<(args: { hour: number }) => SyncableId, HourIdsT>)
                  })
                )
              })
            )
          })
        )
      })
    )
});

export type TimeOrganizedPaths<
  IdT extends SaltedId | SyncableId,
  YearIdsT extends object,
  MonthIdsT extends object,
  DayIdsT extends object,
  HourIdsT extends object,
  YearContentT extends object,
  MonthContentT extends object,
  DayContentT extends object,
  HourContentT extends object
> = ReturnType<
  typeof makeTimeOrganizedPaths<IdT, YearIdsT, MonthIdsT, DayIdsT, HourIdsT, YearContentT, MonthContentT, DayContentT, HourContentT>
>;

const makeTimeOrganizedMailPaths = <IdT extends SaltedId | SyncableId>(
  userFs: SyncableStore,
  parentPath: SyncablePath,
  parentId: Nested<IdT, TimeOrganizedMailIds>
) =>
  makeTimeOrganizedPaths(parentPath, parentId, {
    yearContent: () => ({}),
    monthContent: () => ({}),
    dayContent: () => ({}),
    hourContent: (parentPath, parentId) => makeStoredMailPaths(userFs, parentPath, parentId)
  });
