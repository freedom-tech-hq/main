import type { Mail } from 'freedom-email-user';

export interface GetMailForThread_MailAddedPacket {
  readonly type: 'mail-added';
  readonly mail: Mail[];
}
