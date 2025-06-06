import type { DbUser } from 'freedom-db';
import type { DecryptedInputMessage } from 'freedom-email-api';

export interface OutboundEmailHandlerArgs {
  user: DbUser;
  message: DecryptedInputMessage;
}
