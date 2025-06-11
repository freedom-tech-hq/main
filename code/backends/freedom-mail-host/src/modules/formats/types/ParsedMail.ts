import type { MailMessage } from 'freedom-email-api';

export type ParsedMail = Omit<
  MailMessage,
  // Drop our internal fields
  | 'id'
  | 'userId'
  | 'updatedAt'
  | 'folder'
  | 'threadId' // Detection is sophisticated, not plain parsing, so it is done outside of parseEmail()
  // Drop dynamic fields
  | 'hasAttachments'
  // TODO: add 'attachments'
>;
