import type { MailId } from 'freedom-email-api';

import * as config from '../../config.ts';

export function getMessageIdFromMailId(mailId: MailId): string {
  // Yes, '<>' are required
  return `<${mailId}@${config.EMAIL_DOMAIN}>`;
}
