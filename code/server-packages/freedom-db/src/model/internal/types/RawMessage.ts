import { type IsoDateTime } from 'freedom-basic-data';
import type { EmailUserId } from 'freedom-email-sync';

import type { MessageFolder } from '../../exports.ts';

export interface RawMessage {
  id: string;
  userId: EmailUserId;
  transferredAt: IsoDateTime;
  folder: MessageFolder;
  listMessage: Buffer;
  viewMessage: Buffer;
  raw: Buffer;
}
