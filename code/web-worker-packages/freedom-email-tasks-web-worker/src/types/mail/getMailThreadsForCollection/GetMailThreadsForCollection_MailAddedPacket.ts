import type { MailThread } from 'freedom-email-user';

export interface GetMailThreadsForCollection_MailAddedPacket {
  readonly type: 'mail-added';
  readonly threads: MailThread[];
}
