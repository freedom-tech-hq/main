import type { MailCollectionGroupId } from 'freedom-email-user';

export interface MailCollectionsListGroupTitleDataSourceItem {
  type: 'group-title';
  id: MailCollectionGroupId;
  title: string;
}
