import type { DecryptedListMessage } from './DecryptedListMessage.ts';
import type { MailThreadLikeId } from './MailThreadLikeId.ts';

// Note: thread does not have list and view variants.
// It is always a list version, while the view is a list of ViewMessage.
export interface DecryptedThread {
  // ### Open fields ###
  id: MailThreadLikeId;
  // assumed // userId
  // assumed // folder

  // ### Dynamic ###
  messageCount: number;
  lastMessage: DecryptedListMessage;
}
