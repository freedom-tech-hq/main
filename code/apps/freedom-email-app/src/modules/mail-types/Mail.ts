import type { MailId } from 'freedom-email-sync';

export interface Mail {
  readonly id: MailId;
  readonly from: string;
  readonly to: string;
  readonly subject: string;
  readonly body: string;
  readonly timeMSec: number;
  readonly isUnread: boolean;
}
