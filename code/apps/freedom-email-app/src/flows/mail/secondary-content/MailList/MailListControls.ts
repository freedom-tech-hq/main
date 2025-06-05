import type { MailId } from 'freedom-email-api';

export interface MailListControls {
  getMostRecentMailId?: () => MailId | undefined;
}
