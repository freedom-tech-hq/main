import { reduceAsync } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import type { MailId } from 'freedom-email-sync';
import { getMailPaths } from 'freedom-email-sync';
import type { Nested } from 'freedom-nest';
import { nest } from 'freedom-nest';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { collectionIds, userMailSyncableIds } from '../consts/userMailSyncableIds.ts';
import type { CustomMailCollectionId } from '../types/CustomMailCollectionId.ts';
import type { MailCollectionType } from '../types/MailCollectionType.ts';
import { mailCollectionTypes } from '../types/MailCollectionType.ts';
import type { MailDraftId } from '../types/MailDraftId.ts';

export const getUserMailPaths = async (userFs: SyncableStore) =>
  await nest(userFs.path, async (rootPath) => ({
    ...(await getMailPaths(userFs)),

    // Not Shared with Server

    indexes: await nest(
      [userMailSyncableIds.indexes],
      async (id) => rootPath.append(await id.value(userFs)),
      async (parentPath: SyncablePath, parentId) => ({
        mailIdsByMessageIdIndex: parentPath.append(await parentId.mailIdsByMessageId.value(userFs))
      })
    ),

    // TODO: this is incomplete
    threads: rootPath.append(await userMailSyncableIds.threads.value(userFs)),

    collections: await nest(
      [userMailSyncableIds.collections],
      async (id) => rootPath.append(await id.value(userFs)),
      async (parentPath, parentId) => ({
        ...(await reduceAsync(
          mailCollectionTypes,
          async (out, collectionType) => {
            out[collectionType] = nest(parentPath.append(await parentId[collectionType].value(userFs)), makeTimeOrganizedCollectionPaths);
            return out;
          },
          {} as Record<MailCollectionType, Nested<SyncablePath, TimeOrganizedCollectionPaths>>
        )),
        custom: await nest(
          [parentId.custom],
          async (id) => parentPath.append(await id.value(userFs)),
          async (parentPath, parentId) => ({
            collectionId: async (collectionId: CustomMailCollectionId) =>
              await nest(
                [parentId.collectionId(collectionId)],
                (id) => parentPath.append(id.value),
                async (parentPath, parentId) => ({
                  ...makeTimeOrganizedCollectionPaths(parentPath),
                  collectionMeta: parentPath.append(await parentId.collectionMeta(userFs))
                })
              )
          })
        )
      })
    ),

    routeProcessing: await nest(
      [userMailSyncableIds.routeProcessing],
      async (id) => rootPath.append(await id.value(userFs)),
      makeTimeOrganizedRouteProcessingPaths(userFs)
    ),

    drafts: await nest(
      [userMailSyncableIds.drafts],
      async (id) => rootPath.append(await id.value(userFs)),
      async (parentPath, parentId) => ({
        draftId: async (draftId: MailDraftId) =>
          await nest(
            [parentId.draftId(draftId)],
            (id) => parentPath.append(id.value),
            async (parentPath, parentId) => ({
              draft: parentPath.append(await parentId.draft(userFs)),
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
  }));

export type TimeOrganizedCollectionPaths = ReturnType<typeof makeTimeOrganizedCollectionPaths>;

// Helpers

const makeTimeOrganizedCollectionPaths = (parentPath: SyncablePath) => ({
  year: (date: Date) =>
    nest(parentPath.append(collectionIds.year.value({ year: date.getUTCFullYear() })), (parentPath) => ({
      month: parentPath.append(collectionIds.year.month({ month: date.getUTCMonth() + 1 }))
    }))
});

const makeTimeOrganizedRouteProcessingPaths =
  (userFs: SyncableStore) => (parentPath: SyncablePath, parentId: typeof userMailSyncableIds.routeProcessing) => ({
    year: (date: Date) =>
      nest(
        [parentId.year],
        (id) => parentPath.append(id.value({ year: date.getUTCFullYear() })),
        (parentPath, parentId) => ({
          processedHashesTrackingDoc: async () => parentPath.append(await parentId.processedHashesTrackingDoc(userFs)),
          month: nest(
            [parentId.month],
            (id) => parentPath.append(id.value({ month: date.getUTCMonth() + 1 })),
            (parentPath, parentId) => ({
              processedHashesTrackingDoc: async () => parentPath.append(await parentId.processedHashesTrackingDoc(userFs)),
              day: nest(
                [parentId.day],
                (id) => parentPath.append(id.value({ day: date.getUTCDate() })),
                (parentPath, parentId) => ({
                  processedHashesTrackingDoc: async () => parentPath.append(await parentId.processedHashesTrackingDoc(userFs)),
                  hour: nest(
                    [parentId.hour],
                    (id) => parentPath.append(id.value({ hour: date.getUTCHours() })),
                    (parentPath, parentId) => ({
                      processedMailIdsTrackingDoc: async () => parentPath.append(await parentId.processedMailIdsTrackingDoc(userFs)),
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
