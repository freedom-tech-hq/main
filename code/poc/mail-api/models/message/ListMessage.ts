import type { Message } from './Message';

/** Projection used in thread / message list views. */
export type ListMessage = Pick<
  Message,
  | 'id'
  | 'threadId'
  | 'subject'
  | 'snippet'
  | 'fromPreview'
  | 'toPreview'
  | 'internalDate'
  | 'isUnread'
  | 'hasAttachments'
  | 'labelIds'
  | 'size'
  | 'importance'
>;
