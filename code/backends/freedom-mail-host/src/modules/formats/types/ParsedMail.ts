import type { types } from 'freedom-email-api';

export type ParsedMail = Omit<
  types.MailMessage,
  // Drop our internal fields
  | 'id'
  | 'userId'
  | 'updatedAt'
  | 'folder'
  // Drop dynamic fields
  | 'hasAttachments'
  // TODO: add 'attachments'
>;
