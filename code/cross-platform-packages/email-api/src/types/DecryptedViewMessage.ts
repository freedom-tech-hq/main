import type { DecryptedMessage } from './DecryptedMessage.ts';

// Output-only type, no need for schema
export type DecryptedViewMessage = Pick<DecryptedMessage,
  | 'id'
    // assumed // userId,
  | 'transferredAt'
    // assumed // folder,

  // Decrypted listMessage, see listMessageFieldSchema
  | 'subject'
  | 'from'
  | 'priority'
  | 'snippet'

  // Decrypted viewMessage, see viewMessageFieldSchema
  'to',
  'cc',
  'bcc',
  'replyTo',
  'isBodyHtml',
  'body',

  // Not probably used, but we may want to render them at some point
  'messageId',
  'inReplyTo',
  'references',
  'date'

  // Dynamic
  | 'hasAttachments'
>
