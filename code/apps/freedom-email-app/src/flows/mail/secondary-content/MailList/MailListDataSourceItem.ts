import type { MailId } from 'freedom-email-sync';
import type { Mail, MailDraftId } from 'freedom-email-user';

export type MailListDataSourceItem = MailListDataSourceMailItem | MailListDataSourceDraftItem;

export interface MailListDataSourceMailItem {
  type: 'mail';
  id: MailId;
  mail: Mail;
}

export interface MailListDataSourceDraftItem {
  type: 'draft';
  id: MailDraftId;
  mail: Mail;
}
