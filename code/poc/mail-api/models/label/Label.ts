/** System or user-defined categorization tag. */
export interface Label {
  /** Opaque label id */
  id: string;
  /** Mailbox owner; null ⇒ system label */
  userId: string | null;
  /** Visible name */
  name: string;
  /** “system” | “user” */
  type: 'system' | 'user';
  /** Optional UI color in HEX */
  color?: string;
  /** Parent label id for nesting */
  parentId?: string;
  /** Cached total messages count */
  messageCount: number;
  /** Cached unread messages count */
  unreadCount: number;
}
