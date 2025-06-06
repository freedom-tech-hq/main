import type { MailId } from 'freedom-email-api';

export interface MailAddedPacket {
  readonly type: 'mail-added';
  readonly addedMailIds: MailId[];
}

export interface MailRemovedPacket {
  readonly type: 'mail-removed';
  readonly removedMailIds: MailId[];
}

export type GetMailIdsForThreadPacket = MailAddedPacket | MailRemovedPacket;
