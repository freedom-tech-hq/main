import type { MailThread } from '../../mail-types/MailThread.ts';
import type { MailThreadId } from '../../mail-types/MailThreadId.ts';

export interface MailThreadDataSourceItem {
  type: 'mail-thread';
  id: MailThreadId;
  thread: MailThread;
}
