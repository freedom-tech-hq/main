import type { MailThreadId } from './MailThreadId.ts';

export interface MailThread {
  readonly id: MailThreadId;
  readonly from: string;
  readonly to: string;
  readonly subject: string;
  readonly body: string;
  readonly timeMSec: number;
  readonly numMessages: number;
  readonly numUnread: number;
}
