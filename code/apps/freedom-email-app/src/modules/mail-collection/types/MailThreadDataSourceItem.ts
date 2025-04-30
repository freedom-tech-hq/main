import type { ThreadLikeId } from 'freedom-email-user';

export interface MailThreadDataSourceItem {
  type: 'mail-thread';
  id: ThreadLikeId;
  timeMSec: number;
}
