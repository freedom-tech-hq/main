import type { MailThreadLikeId } from 'freedom-email-api';

export interface MailThreadsAddedPacket {
  readonly type: 'threads-added';
  readonly addedThreadIds: MailThreadLikeId[];
  readonly estCount: number;
}

export interface MailThreadsRemovedPacket {
  readonly type: 'threads-removed';
  readonly removedThreadIds: MailThreadLikeId[];
  readonly estCount: number;
}

export type GetMailThreadIdsForMessageFolderPacket = MailThreadsAddedPacket | MailThreadsRemovedPacket;
