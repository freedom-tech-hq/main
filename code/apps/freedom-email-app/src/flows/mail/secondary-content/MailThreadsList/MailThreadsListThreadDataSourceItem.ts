import type { MailThreadLikeId } from 'freedom-email-api';
import type { MailThreadsDataSetId } from 'freedom-email-tasks-web-worker';

export interface MailThreadsListThreadDataSourceItem {
  type: 'mail-thread';
  id: MailThreadLikeId;
  timeMSec: number;
  dataSetId: MailThreadsDataSetId;
}
