import type { ThreadLikeId } from './ThreadLikeId.ts';

export interface MailThread {
  readonly id: ThreadLikeId;
  readonly from: string;
  readonly to: string[];
  readonly subject: string;
  readonly body: string;
  readonly timeMSec: number;
  readonly numMessages: number;
  readonly numUnread: number;
  readonly numAttachments: number;
}
