import type { MailCollection } from '../../mail-types/MailCollection.ts';
import type { SelectableMailCollectionId } from '../../mail-types/SelectableMailCollectionId.ts';

export interface MailCollectionsListCollectionDataSourceItem {
  type: 'collection';
  id: SelectableMailCollectionId;
  collection: MailCollection;
}
