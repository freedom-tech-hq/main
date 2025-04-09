import type { MailThreadId } from 'freedom-email-user';

export interface GetMailThreadsForCollection_MailRemovedPacket {
  readonly type: 'mail-removed';
  readonly ids: MailThreadId[];
}
