import type { ThreadLikeId } from 'freedom-email-user';

export interface MailThreadsListThreadDataSourceItem {
  type: 'mail-thread';
  id: ThreadLikeId;
  timeMSec: number;
}
