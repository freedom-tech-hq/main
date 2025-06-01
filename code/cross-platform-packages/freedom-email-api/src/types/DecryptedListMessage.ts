import type { AllFieldsOfMessage } from './AllFieldsOfMessage.ts';

// Output-only type, no need for schema
export type DecryptedListMessage = Pick<
  AllFieldsOfMessage,
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
