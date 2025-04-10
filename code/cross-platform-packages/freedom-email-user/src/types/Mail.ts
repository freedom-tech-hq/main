import type { MailLikeId } from './MailLikeId.ts';

export interface Mail {
  readonly id: MailLikeId;
  readonly from: string;
  readonly to: string[];
  readonly subject: string;
  readonly body: string;
  readonly timeMSec: number;
  readonly isUnread: boolean;
}
