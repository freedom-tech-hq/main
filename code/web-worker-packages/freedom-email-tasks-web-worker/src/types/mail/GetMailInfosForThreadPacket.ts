import type { MailId } from 'freedom-email-api';

export interface MailInfo {
  id: MailId;
  timeMSec: number;
}

export interface MailAddedPacket {
  readonly type: 'mail-added';
  readonly addedMailInfos: MailInfo[];
  readonly estCount: number;
  readonly estRemainingCount: number;
}

export interface MailRemovedPacket {
  readonly type: 'mail-removed';
  readonly removedMailIds: MailId[];
  readonly estCount: number;
  readonly estRemainingCount: number;
}

export type GetMailInfosForThreadPacket = MailAddedPacket | MailRemovedPacket;
