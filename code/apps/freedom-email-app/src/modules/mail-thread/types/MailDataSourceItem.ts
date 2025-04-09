import type { MailId } from 'freedom-email-sync';
import type { Mail, MailDraftId } from 'freedom-email-user';

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
