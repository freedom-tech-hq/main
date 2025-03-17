import type { Mail } from '../../mail-types/Mail.ts';
import type { MailId } from '../../mail-types/MailId.ts';

export interface MailDataSourceItem {
  type: 'mail';
  id: MailId;
  mail: Mail;
}
