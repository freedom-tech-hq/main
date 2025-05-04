import type { User } from 'freedom-db';
import type { EmailAccess, MailId } from 'freedom-email-sync';

export interface OutboundEmailHandlerArgs {
  user: User;
  access: EmailAccess;
  emailIds: MailId[];
}
