import type { MailId } from 'freedom-email-sync';
import type { MailDraftId } from 'freedom-email-user';

import type { Mail } from '../../mail-types/Mail.ts';

export type MailDataSourceItem = MailDataSourceMailItem | MailDataSourceDraftItem;

export interface MailDataSourceMailItem {
  type: 'mail';
  id: MailId;
  mail: Mail;
}

export interface MailDataSourceDraftItem {
  type: 'draft';
  id: MailDraftId;
  mail: Mail;
}
