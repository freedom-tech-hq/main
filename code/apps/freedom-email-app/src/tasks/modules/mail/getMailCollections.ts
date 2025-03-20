import type { PR, Result } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { getBundleFileAtPath } from 'freedom-syncable-store-types';
import type { TypeOrPromisedType } from 'yaschema';

import type { MailCollection } from '../../../modules/mail-types/MailCollection.js';
import type { MailCollectionGroup } from '../../../modules/mail-types/MailCollectionGroup.js';
import type { MailCollectionGroupId } from '../../../modules/mail-types/MailCollectionGroupId.js';
import { mailCollectionGroupIdInfo } from '../../../modules/mail-types/MailCollectionGroupId.js';
import type { MailCollectionId } from '../../../modules/mail-types/MailCollectionId.js';
import { mailCollectionIdInfo } from '../../../modules/mail-types/MailCollectionId.js';
import { MAIL_COLLECTIONS_BUNDLE_ID, MAIL_FOLDER_ID } from '../../consts/user-syncable-paths.js';
import { useActiveUserId } from '../../contexts/active-user-id.js';
import { getUserFs } from '../internal/storage/getUserFs.js';

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

    const mailCollectionsBundle = await getBundleFileAtPath(
      trace,
      userFs.value,
      userFs.value.path.dynamic.append(MAIL_FOLDER_ID, MAIL_COLLECTIONS_BUNDLE_ID)
    );
    if (!mailCollectionsBundle.ok) {
      return generalizeFailureResult(trace, mailCollectionsBundle, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    const mailCollectionIds = await mailCollectionsBundle.value.getIds(trace, { type: 'bundleFile' });
    if (!mailCollectionIds.ok) {
      return mailCollectionIds;
    }

    const groups: MailCollectionGroup[] = [];

    groups.push({
      id: mailCollectionGroupIdInfo.make('primary'),
      collections: mailCollectionIds.value.map(
        (id): MailCollection => ({
          // TODO: TEMP
          id: mailCollectionIdInfo.make(id),
          collectionType: 'inbox',
          title: 'Inbox',
          unreadCount: 0
        })
      )
    });

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
