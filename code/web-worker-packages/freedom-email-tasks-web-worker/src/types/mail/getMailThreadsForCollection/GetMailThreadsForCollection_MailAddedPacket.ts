import type { ThreadLikeId } from 'freedom-email-user';

export interface GetMailThreadsForCollection_MailAddedPacket {
  readonly type: 'mail-added';
  readonly threadIds: ThreadLikeId[];
}
