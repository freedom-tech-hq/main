import type { Message } from './Message';

/** Projection returned when a single message is opened. */
export type ViewMessage = Pick<
  Message,
  | 'id'
  | 'threadId'
  | 'subject'
  | 'dateHeader'
  | 'from'
  | 'to'
  | 'cc'
  | 'bcc'
  | 'replyTo'
  | 'messageId'
  | 'inReplyTo'
  | 'references'
  | 'mimeVersion'
  | 'contentType'
  | 'charset'
  | 'contentTransferEncoding'
  | 'dkimStatus'
  | 'spfStatus'
  | 'isUnread'
  | 'importance'
  | 'labelIds'
  | 'size'
  | 'snippet'
  | 'bodyParts'
  | 'attachments'
>;
