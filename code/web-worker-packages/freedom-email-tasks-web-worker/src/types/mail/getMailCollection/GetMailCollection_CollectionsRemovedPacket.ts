import type { CollectionLikeId, MailCollectionGroupId } from 'freedom-email-user';

export interface GetMailCollection_CollectionsRemovedPacket {
  readonly type: 'collections-removed';
  readonly idsByGroupId: Record<MailCollectionGroupId, CollectionLikeId[]>;
}
