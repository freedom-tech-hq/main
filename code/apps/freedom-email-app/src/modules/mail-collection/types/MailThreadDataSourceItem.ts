import type { MailThread } from '../../mail-types/MailThread.ts';
import type { ThreadLikeId } from '../../mail-types/ThreadLikeId.ts';

export interface MailThreadDataSourceItem {
  type: 'mail-thread';
  id: ThreadLikeId;
  thread: MailThread;
}
