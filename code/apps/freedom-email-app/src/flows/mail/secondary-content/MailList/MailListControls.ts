import type { Mail } from 'freedom-email-user';

export interface MailListControls {
  getMostRecentMail?: () => Mail | undefined;
}
