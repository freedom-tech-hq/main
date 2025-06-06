import type { MailId } from 'freedom-email-api';
import type { MailMessagesDataSetId } from 'freedom-email-tasks-web-worker/lib/types/mail/MailMessagesDataSetId';

export type MailListDataSourceItem = MailListDataSourceMailItem | MailListDataSourceCollapsedItems;

export interface MailListDataSourceMailItem {
  type: 'mail';
  id: MailId;
  dataSetId: MailMessagesDataSetId;
}

export interface MailListDataSourceCollapsedItems {
  type: 'collapsed';
  id: 'collapsed';
  count: number;
}
