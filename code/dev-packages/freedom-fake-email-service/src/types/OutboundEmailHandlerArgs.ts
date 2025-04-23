import type { EmailAccess, MailId } from 'freedom-email-sync';

import type { User } from '../utils/getUserStore.ts';

export interface OutboundEmailHandlerArgs {
  user: User;
  access: EmailAccess;
  emailIds: MailId[];
}
