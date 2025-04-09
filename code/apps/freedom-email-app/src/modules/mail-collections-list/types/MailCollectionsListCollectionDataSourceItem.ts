import type { CollectionLikeId } from '../../mail-types/CollectionLikeId.ts';
import type { MailCollection } from '../../mail-types/MailCollection.ts';

export interface MailCollectionsListCollectionDataSourceItem {
  type: 'collection';
  id: CollectionLikeId;
  collection: MailCollection;
}
