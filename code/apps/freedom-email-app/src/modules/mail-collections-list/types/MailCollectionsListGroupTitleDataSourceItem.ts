import type { MailCollectionGroupId } from '../../mail-types/MailCollectionGroupId.ts';

export interface MailCollectionsListGroupTitleDataSourceItem {
  type: 'group-title';
  id: MailCollectionGroupId;
  title: string;
}
