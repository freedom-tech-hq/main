import type { MailId } from 'freedom-email-api';
import type { MailMessagesDataSetId } from 'freedom-email-tasks-web-worker/lib/types/mail/MailMessagesDataSetId';

export type MailListDataSourceItem = MailListDataSourceMailItem | MailListDataSourceCollapsedItems | MailListDataSourceLoadMoreItems;

export interface MailListDataSourceMailItem {
  type: 'mail';
  id: MailId;
  timeMSec: number;
  dataSetId: MailMessagesDataSetId;
}

export interface MailListDataSourceCollapsedItems {
  type: 'collapsed';
  id: 'collapsed';
  timeMSec: number;
  count: number;
}

export interface MailListDataSourceLoadMoreItems {
  type: 'load-more';
  id: 'load-more';
  count: number;
}
