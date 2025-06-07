import type { MailThreadLikeId } from 'freedom-email-api';

export interface MailThreadInfo {
  id: MailThreadLikeId;
  timeMSec: number;
}

export interface MailThreadsAddedPacket {
  readonly type: 'threads-added';
  readonly addedThreadInfos: MailThreadInfo[];
  readonly estCount: number;
  readonly estRemainingCount: number;
}

export interface MailThreadsRemovedPacket {
  readonly type: 'threads-removed';
  readonly removedThreadIds: MailThreadLikeId[];
  readonly estCount: number;
  readonly estRemainingCount: number;
}

export type GetMailThreadInfosForMessageFolderPacket = MailThreadsAddedPacket | MailThreadsRemovedPacket;
