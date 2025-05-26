import type { MailboxAddress } from '../shared/MailboxAddress';

/** Conversation container aggregating related messages. */
export interface Thread {
  /** Opaque thread id */
  id: string;
  /** Owner mailbox id */
  userId: string;
  /** Subject taken from the latest message */
  subject: string;
  /** Id of the most recent message */
  lastMessageId: string;
  /** Total messages in this thread */
  messageCount: number;
  /** ISO timestamp of last activity */
  lastUpdatedAt: string;
  /** true ⇒ user muted notifications */
  isMuted: boolean;
  /** Unique participants across the thread */
  participants: MailboxAddress[];
  /** Distinct labels applied to any message in thread */
  labelIds: string[];
}
