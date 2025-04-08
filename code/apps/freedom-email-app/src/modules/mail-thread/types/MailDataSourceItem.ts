import type { MailId } from 'freedom-email-sync';

import type { Mail } from '../../mail-types/Mail.ts';

export interface MailDataSourceItem {
  type: 'mail';
  id: MailId;
  mail: Mail;
}
