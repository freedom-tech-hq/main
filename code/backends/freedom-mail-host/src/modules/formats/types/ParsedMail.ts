import type { MailMessage } from 'freedom-email-api';

export type ParsedMail = Omit<
  MailMessage,
  // Drop our internal fields
  | 'id'
  | 'userId'
  | 'updatedAt'
  | 'folder'
  // Drop dynamic fields
  | 'hasAttachments'
  // TODO: add 'attachments'
>;
