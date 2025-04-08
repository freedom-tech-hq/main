import type { MailCollection } from '../../mail-types/MailCollection.ts';
import type { CollectionLikeId } from '../../mail-types/CollectionLikeId.ts';

export interface MailCollectionsListCollectionDataSourceItem {
  type: 'collection';
  id: CollectionLikeId;
  collection: MailCollection;
}
