import type { Uuid } from 'freedom-contexts';
import type { MailThreadLikeId } from 'freedom-email-api';
import type { MailThreadsDataSetId } from 'freedom-email-tasks-web-worker';

export type MailThreadsListDataSourceItem = MailThreadsListThreadDataSourceItem | MailThreadsListThreadPlaceholderDataSourceItem;

export interface MailThreadsListThreadDataSourceItem {
  type: 'mail-thread';
  id: MailThreadLikeId;
  timeMSec: number;
  dataSetId: MailThreadsDataSetId;
}

export interface MailThreadsListThreadPlaceholderDataSourceItem {
  type: 'mail-thread-placeholder';
  uid: Uuid;
}
