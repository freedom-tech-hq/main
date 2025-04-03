import type { PR, Result } from 'freedom-async';
import { log, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractUnmarkedSyncableId } from 'freedom-sync-types';
import { getBundleAtPath, getConflictFreeDocumentFromBundleAtPath } from 'freedom-syncable-store-types';
import type { TypeOrPromisedType } from 'yaschema';

import type { MailCollection } from '../../../modules/mail-types/MailCollection.ts';
import type { MailCollectionGroup } from '../../../modules/mail-types/MailCollectionGroup.ts';
import type { MailCollectionGroupId } from '../../../modules/mail-types/MailCollectionGroupId.ts';
import { mailCollectionGroupIdInfo } from '../../../modules/mail-types/MailCollectionGroupId.ts';
import type { MailCollectionId } from '../../../modules/mail-types/MailCollectionId.ts';
import { mailCollectionIdInfo } from '../../../modules/mail-types/MailCollectionId.ts';
import { MAIL_COLLECTIONS_BUNDLE_ID, MAIL_FOLDER_ID } from '../../consts/user-syncable-paths.ts';
import { useActiveUserId } from '../../contexts/active-user-id.ts';
import { makeMailCollectionDocumentFromSnapshot } from '../../types/MailCollectionDocument.ts';
import { getUserFs } from '../internal/storage/getUserFs.ts';

export interface GetMailCollection_GroupsAddedPacket {
  readonly type: 'groups-added';
  readonly groups: MailCollectionGroup[];
}

export interface GetMailCollection_GroupsRemovedPacket {
  readonly type: 'groups-removed';
  readonly ids: MailCollectionGroupId[];
}

export interface GetMailCollection_CollectionsAddedPacket {
  readonly type: 'collections-added';
  readonly byGroupId: Record<MailCollectionGroupId, MailCollection[]>;
}

export interface GetMailCollection_CollectionsRemovedPacket {
  readonly type: 'collections-removed';
  readonly idsByGroupId: Record<MailCollectionGroupId, MailCollectionId[]>;
}

export type GetMailCollectionPacket =
  | GetMailCollection_GroupsAddedPacket
  | GetMailCollection_GroupsRemovedPacket
  | GetMailCollection_CollectionsAddedPacket
  | GetMailCollection_CollectionsRemovedPacket;

export const getMailCollections = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    _isConnected: () => TypeOrPromisedType<boolean>,
    _onData: (value: Result<GetMailCollectionPacket>) => TypeOrPromisedType<void>
  ): PR<GetMailCollection_GroupsAddedPacket> => {
    const activeUserId = useActiveUserId(trace);

    if (activeUserId.userId === undefined) {
      return makeSuccess({ type: 'groups-added' as const, groups: [] });
    }

    const userFs = await getUserFs(trace, { userId: activeUserId.userId });
    if (!userFs.ok) {
      return userFs;
    }

    const mailFolderId = await MAIL_FOLDER_ID(userFs.value);
    const mailCollectionsBundleId = await MAIL_COLLECTIONS_BUNDLE_ID(userFs.value);

    const mailCollectionsBundle = await getBundleAtPath(
      trace,
      userFs.value,
      userFs.value.path.append(mailFolderId, mailCollectionsBundleId)
    );
    if (!mailCollectionsBundle.ok) {
      return generalizeFailureResult(trace, mailCollectionsBundle, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    const collectionIds = await mailCollectionsBundle.value.getIds(trace, { type: 'bundle' });
    if (!collectionIds.ok) {
      return collectionIds;
    }

    const groups: MailCollectionGroup[] = [];

    for (const collectionId of collectionIds.value) {
      const collectionPath = mailCollectionsBundle.value.path.append(collectionId);
      const collectionDoc = await getConflictFreeDocumentFromBundleAtPath(trace, userFs.value, collectionPath, {
        newDocument: makeMailCollectionDocumentFromSnapshot,
        //   // TODO: TEMP
        isSnapshotValid: async () => makeSuccess(true),
        //   // TODO: TEMP
        isDeltaValidForDocument: async () => makeSuccess(true)
      });
      if (!collectionDoc.ok) {
        log().debug?.(trace, `Failed to read collection ${collectionId}:`, collectionDoc.value);
        continue;
      }

      groups.push({
        id: mailCollectionGroupIdInfo.make(),
        collections: collectionIds.value
          .map(extractUnmarkedSyncableId)
          .filter(mailCollectionIdInfo.is)
          .map(
            (id): MailCollection => ({
              // TODO: TEMP
              id,
              collectionType: collectionDoc.value.collectionType.get(),
              title: collectionDoc.value.name.get(),
              unreadCount: 0
            })
          )
      });
    }

    // const groups: MailCollectionGroup[] = [];

    // groups.push({
    //   id: mailCollectionGroupIdInfo.make('primary'),
    //   collections: [
    //     { id: mailCollectionIdInfo.make('inbox'), collectionType: 'inbox', title: 'Inbox', unreadCount: Math.floor(Math.random() * 99999) },
    //     {
    //       id: mailCollectionIdInfo.make('outbox'),
    //       collectionType: 'outbox',
    //       title: 'Outbox',
    //       unreadCount: 0
    //     },
    //     { id: mailCollectionIdInfo.make('sent'), collectionType: 'sent', title: 'Sent', unreadCount: 0 },
    //     {
    //       id: mailCollectionIdInfo.make('drafts'),
    //       collectionType: 'drafts',
    //       title: 'Drafts',
    //       unreadCount: 0
    //     },
    //     { id: mailCollectionIdInfo.make('junk'), collectionType: 'spam', title: 'Junk', unreadCount: Math.floor(Math.random() * 99999) },
    //     { id: mailCollectionIdInfo.make('trash'), collectionType: 'trash', title: 'Trash', unreadCount: 0 },
    //     { id: mailCollectionIdInfo.make('archive'), collectionType: 'archive', title: 'Archive', unreadCount: 0 }
    //   ]
    // });

    return makeSuccess({ type: 'groups-added' as const, groups });
  }
);
