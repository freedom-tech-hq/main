import type { AllFieldsOfMessage } from './AllFieldsOfMessage.ts';

// Output-only type, no need for schema
export type DecryptedViewMessage = Pick<
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

  // Decrypted viewFields, see viewFieldsFieldSchema
  | 'to'
  | 'cc'
  | 'bcc'
  | 'replyTo'
  | 'isBodyHtml'
  | 'body'
  | 'messageId'
  | 'inReplyTo'
  | 'references'
  | 'date'

  // Dynamic
  // TODO: | 'listAttachments'
>;
