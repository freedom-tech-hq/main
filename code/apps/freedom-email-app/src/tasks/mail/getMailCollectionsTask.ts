import type { PR, Result } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { TypeOrPromisedType } from 'yaschema';

import type { MailCollection } from '../../modules/mail-types/MailCollection.ts';
import type { MailCollectionGroup } from '../../modules/mail-types/MailCollectionGroup.ts';
import { type MailCollectionGroupId, mailCollectionGroupIdInfo } from '../../modules/mail-types/MailCollectionGroupId.ts';
import { type MailCollectionId, mailCollectionIdInfo } from '../../modules/mail-types/MailCollectionId.ts';

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

export const getMailCollectionsTask = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    _trace,
    _isConnected: () => TypeOrPromisedType<boolean>,
    _onData: (value: Result<GetMailCollectionPacket>) => TypeOrPromisedType<void>
  ): PR<GetMailCollection_GroupsAddedPacket> => {
    const groups: MailCollectionGroup[] = [];

    groups.push({
      id: mailCollectionGroupIdInfo.make('primary'),
      collections: [
        { id: mailCollectionIdInfo.make('inbox'), collectionType: 'inbox', title: 'Inbox', unreadCount: Math.floor(Math.random() * 99999) },
        {
          id: mailCollectionIdInfo.make('outbox'),
          collectionType: 'outbox',
          title: 'Outbox',
          unreadCount: 0
        },
        { id: mailCollectionIdInfo.make('sent'), collectionType: 'sent', title: 'Sent', unreadCount: 0 },
        {
          id: mailCollectionIdInfo.make('drafts'),
          collectionType: 'drafts',
          title: 'Drafts',
          unreadCount: 0
        },
        { id: mailCollectionIdInfo.make('junk'), collectionType: 'spam', title: 'Junk', unreadCount: Math.floor(Math.random() * 99999) },
        { id: mailCollectionIdInfo.make('trash'), collectionType: 'trash', title: 'Trash', unreadCount: 0 },
        { id: mailCollectionIdInfo.make('archive'), collectionType: 'archive', title: 'Archive', unreadCount: 0 }
      ]
    });

    return makeSuccess({ type: 'groups-added' as const, groups });
  }
);
