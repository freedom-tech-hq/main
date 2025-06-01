import type { MailMessage } from './MailMessage.ts';

// Output-only type, no need for schema
export type DecryptedListMessage = Pick<
  MailMessage,
  | 'id'
  // assumed // userId,
  | 'transferredAt'
  // assumed // folder,

  // Decrypted listFields, see listFieldsFieldSchema
  | 'subject'
  | 'from'
  | 'priority'
  | 'snippet'

  // Dynamic
  | 'hasAttachments'
>;
