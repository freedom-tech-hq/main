import type { MailCollection } from '../../mail-types/MailCollection.ts';
import type { MailCollectionId } from '../../mail-types/MailCollectionId.ts';

export interface MailCollectionsListCollectionDataSourceItem {
  type: 'collection';
  id: MailCollectionId;
  collection: MailCollection;
}
