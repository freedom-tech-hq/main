import type { MailCollection, MailCollectionGroupId } from 'freedom-email-user';

export interface GetMailCollection_CollectionsAddedPacket {
  readonly type: 'collections-added';
  readonly byGroupId: Record<MailCollectionGroupId, MailCollection[]>;
}
