import type { DecryptedMessage } from './DecryptedMessage.ts';

// Output-only type, no need for schema
export type DecryptedListMessage = Pick<DecryptedMessage,
  | 'id'
    // assumed // userId,
  | 'transferredAt'
    // assumed // folder,

  // Decrypted listMessage, see listMessageFieldSchema
  | 'subject'
  | 'from'
  | 'priority'
  | 'snippet'

  // Dynamic
  | 'hasAttachments'
>
