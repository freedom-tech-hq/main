import { reduceAsync } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
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
        mailIdsByMessageIdIndex: parentPath.append(await parentId.emailUuidsByMessageId.value(userFs))
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
            out[collectionType] = nest(parentPath.append(await parentId[collectionType].value(userFs)), collectionYearMonth);
            return out;
          },
          {} as Record<MailCollectionType, Nested<SyncablePath, CollectionYearMonth>>
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
                  ...collectionYearMonth(parentPath),
                  collectionMeta: parentPath.append(await parentId.collectionMeta(userFs))
                })
              )
          })
        )
      })
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

// Helpers

const collectionYearMonth = (parentPath: SyncablePath) => ({
  year: (date: Date) =>
    nest(parentPath.append(collectionIds.year.value({ year: date.getUTCFullYear() })), (parentPath) => ({
      month: parentPath.append(collectionIds.year.month({ month: date.getUTCMonth() + 1 }))
    }))
});
type CollectionYearMonth = ReturnType<typeof collectionYearMonth>;
