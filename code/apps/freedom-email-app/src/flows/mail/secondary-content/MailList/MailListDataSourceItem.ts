import type { MailId } from 'freedom-email-api';

export type MailListDataSourceItem = MailListDataSourceMailItem | MailListDataSourceCollapsedItems;

export interface MailListDataSourceMailItem {
  type: 'mail';
  id: MailId;
}

export interface MailListDataSourceCollapsedItems {
  type: 'collapsed';
  id: 'collapsed';
  count: number;
}
