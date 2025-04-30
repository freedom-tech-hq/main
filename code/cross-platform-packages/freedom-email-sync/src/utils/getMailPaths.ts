import type { Uuid } from 'freedom-basic-data';
import type { Nested } from 'freedom-nest';
import { nest } from 'freedom-nest';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

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

export type TimeOrganizedMailPaths = Nested<SyncablePath, ReturnType<ReturnType<typeof makeTimeOrganizedMailPaths>>>;

// Helpers

const internalGetMailPaths = async (userFs: SyncableStore) =>
  await nest(userFs.path, async (rootPath) => ({
    storage: await nest(
      [mailSyncableIds.storage],
      async (id) => rootPath.append(await id.value(userFs)),
      makeTimeOrganizedMailPaths(userFs)
    ),
    out: await nest([mailSyncableIds.out], async (id) => rootPath.append(await id.value(userFs)), makeTimeOrganizedMailPaths(userFs))
  }));

const makeTimeOrganizedMailPaths =
  (userFs: SyncableStore) => (parentPath: SyncablePath, parentId: typeof mailSyncableIds.storage | typeof mailSyncableIds.out) => ({
    year: (date: Date) =>
      nest(
        [parentId.year],
        (id) => parentPath.append(id.value({ year: date.getUTCFullYear() })),
        (parentPath, parentId) => ({
          month: nest(
            [parentId.month],
            (id) => parentPath.append(id.value({ month: date.getUTCMonth() + 1 })),
            (parentPath, parentId) => ({
              day: nest(
                [parentId.day],
                (id) => parentPath.append(id.value({ day: date.getUTCDate() })),
                (parentPath, parentId) => ({
                  hour: nest(
                    [parentId.hour],
                    (id) => parentPath.append(id.value({ hour: date.getUTCHours() })),
                    (parentPath, parentId) => ({
                      mailId: (mailId: MailId) =>
                        nest(
                          [parentId.emailId],
                          (id) => parentPath.append(id.value(mailId)),
                          async (parentPath, parentId) => ({
                            summary: parentPath.append(await parentId.summary(userFs)),
                            detailed: parentPath.append(await parentId.detailed(userFs)),
                            attachments: nest(
                              [parentId.attachments],
                              async (id) => parentPath.append(await id.value(userFs)),
                              (parentPath, parentId) => ({
                                attachmentId: async (uuid?: Uuid) =>
                                  await nest(
                                    [parentId.attachmentId],
                                    (id) => parentPath.append(id.value(uuid)),
                                    async (parentPath, parentId) => ({
                                      chunkId: async (chunkNumber: number) => parentPath.append(await parentId.chunkId(chunkNumber)(userFs))
                                    })
                                  )
                              })
                            )
                          })
                        )
                    })
                  )
                })
              )
            })
          )
        })
      )
  });
