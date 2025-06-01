import type { MailMessage } from './MailMessage.ts';

// Output-only type, no need for schema
export type DecryptedViewMessage = Pick<
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
