import { reduceAsync } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import type { MailId } from 'freedom-email-sync';
import { getMailPaths, makeTimeOrganizedPaths } from 'freedom-email-sync';
import type { Nested } from 'freedom-nest';
import { nest } from 'freedom-nest';
import type { SyncableId, SyncablePath } from 'freedom-sync-types';
import type { SaltedId, SyncableStore } from 'freedom-syncable-store-types';

import type { MarkerFileIds, TimeOrganizedMarkerIds } from '../consts/userMailSyncableIds.ts';
import { userMailSyncableIds } from '../consts/userMailSyncableIds.ts';
import type { CustomMailCollectionId } from '../types/CustomMailCollectionId.ts';
import type { MailCollectionType } from '../types/MailCollectionType.ts';
import { mailCollectionTypes } from '../types/MailCollectionType.ts';
import type { MailDraftId } from '../types/MailDraftId.ts';

const globalCache = new WeakMap<SyncableStore, UserMailPaths>();

export const getUserMailPaths = async (userFs: SyncableStore) => {
  const cached = globalCache.get(userFs);
  if (cached !== undefined) {
    return cached;
  }

  const newValue = await internalGetUserMailPaths(userFs);
  globalCache.set(userFs, newValue);
  return newValue;
};

export type UserMailPaths = Awaited<ReturnType<typeof internalGetUserMailPaths>>;

// Helpers

const internalGetUserMailPaths = async (userFs: SyncableStore) =>
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
          mailCollectionTypes.exclude('custom'),
          async (collections, collectionType) => {
            collections[collectionType] = await nest(
              [parentId[collectionType]],
              async (id) => parentPath.append(await id.value(userFs)),
              (parentPath, parentId) => makeTimeOrganizedMarkerPaths(parentPath, parentId)
            );
            return collections;
          },
          {} as Record<Exclude<MailCollectionType, 'custom'>, Nested<SyncablePath, TimeOrganizedMarkerPaths>>
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
                  ...makeTimeOrganizedMarkerPaths(parentPath, parentId),
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
      (parentPath, parentId) => makeTimeOrganizedMarkerPaths(parentPath, parentId)
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

const makeMarkerFilePaths = (parentPath: SyncablePath, parentId: MarkerFileIds) => ({
  mailId: (mailId: MailId) => parentPath.append(parentId.mailId(mailId))
});

export type MarkerFilePaths = ReturnType<typeof makeMarkerFilePaths>;

const makeTimeOrganizedMarkerPaths = <IdT extends SaltedId | SyncableId>(
  parentPath: SyncablePath,
  parentId: Nested<IdT, TimeOrganizedMarkerIds>
) =>
  makeTimeOrganizedPaths(parentPath, parentId, {
    yearContent: () => ({}),
    monthContent: () => ({}),
    dayContent: () => ({}),
    hourContent: makeMarkerFilePaths
  });

export type TimeOrganizedMarkerPaths = ReturnType<typeof makeTimeOrganizedMarkerPaths>;
