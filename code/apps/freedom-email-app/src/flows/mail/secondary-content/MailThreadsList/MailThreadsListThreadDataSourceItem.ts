import type { MailThreadLikeId } from 'freedom-email-api';

export interface MailThreadsListThreadDataSourceItem {
  type: 'mail-thread';
  id: MailThreadLikeId;
  timeMSec: number;
}
