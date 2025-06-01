import type { types } from 'freedom-email-api';

export type ParsedMail = Omit<
  types.DecryptedMessage,
  // Drop our internal fields
  | 'id'
  | 'userId'
  | 'transferredAt'
  | 'folder'
  // Drop dynamic fields
  | 'hasAttachments'
  // TODO: add 'attachments'
>;
