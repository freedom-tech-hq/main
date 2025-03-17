import type { MailCollectionsListCollectionDataSourceItem } from './MailCollectionsListCollectionDataSourceItem.ts';
import type { MailCollectionsListGroupTitleDataSourceItem } from './MailCollectionsListGroupTitleDataSourceItem.ts';
import type { MailCollectionsListSeparatorDataSourceItem } from './MailCollectionsListSeparatorDataSourceItem.ts';

export type MailCollectionsListDataSourceItem =
  | MailCollectionsListCollectionDataSourceItem
  | MailCollectionsListSeparatorDataSourceItem
  | MailCollectionsListGroupTitleDataSourceItem;
