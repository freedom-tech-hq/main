import type { MailId } from 'freedom-email-sync';

export interface GetMailForThread_MailRemovedPacket {
  readonly type: 'mail-removed';
  readonly ids: MailId[];
}
