import type { CollectionLikeId, MailCollection } from 'freedom-email-user';

export interface MailCollectionsListCollectionDataSourceItem {
  type: 'collection';
  id: CollectionLikeId;
  collection: MailCollection;
}
