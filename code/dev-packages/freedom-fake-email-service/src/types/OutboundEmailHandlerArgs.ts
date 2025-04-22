import type { EmailAccess, MailId } from 'freedom-email-sync';

import type { User } from '../utils/mockUserDb.ts';

export interface OutboundEmailHandlerArgs {
  user: User;
  access: EmailAccess;
  emailIds: MailId[];
}
