import type { MailMessage } from './MailMessage.ts';

// Output-only type, no need for schema
export type DecryptedListMessage = Pick<
  MailMessage,
  | 'id'
  // assumed // userId,
  | 'updatedAt'
  // assumed // folder,

  // Decrypted listFields, see listFieldsFieldSchema
  | 'subject'
  | 'from'
  | 'sender'
  | 'priority'
  | 'snippet'

  // Dynamic
  | 'hasAttachments'
>;
