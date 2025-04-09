import type { MailThread, ThreadLikeId } from 'freedom-email-user';

export interface MailThreadDataSourceItem {
  type: 'mail-thread';
  id: ThreadLikeId;
  thread: MailThread;
}
