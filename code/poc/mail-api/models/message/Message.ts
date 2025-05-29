import type { MailboxAddress } from '../shared/MailboxAddress';
import type { AttachmentMeta } from './AttachmentMeta';

/** Canonical store model; superset of every projection we expose. */
export interface Message {
  /** Opaque message id */
  id: string;
  /** Owner mailbox id */
  userId: string;
  /** Conversation container */
  threadId: string;
  /** Decoded Subject header */
  subject: string;
  /** First 120 chars plain text */
  snippet: string;
  /** “Display Name <address>” (first mailbox) */
  fromPreview: string;
  /** First To recipient or “Me” */
  toPreview: string;
  /** Server-normalized RFC 3339 timestamp */
  internalDate: string;
  /** true → UNREAD system label present */
  isUnread: boolean;
  /** Quick UI badge flag */
  hasAttachments: boolean;
  /** All system + user labels */
  labelIds: string[];
  /** true → DRAFT system label present. TODO: consider making this dynamic */
  isDraft: boolean;
  /** Raw RFC length (bytes) */
  size: number;
  /** Heuristic priority */
  importance: 'none' | 'low' | 'high';

  /* Detailed envelope & routing */
  /** Original Date header string */
  dateHeader: string;
  /** Full From list */
  from: MailboxAddress[];
  /** RFC To list */
  to: MailboxAddress[];
  /** CC list, possibly empty */
  cc?: MailboxAddress[];
  /** BCC list, owner only */
  bcc?: MailboxAddress[];
  /** Explicit Reply-To */
  replyTo?: MailboxAddress[];
  /** Raw Message-ID */
  messageId: string;
  /** Raw In-Reply-To header */
  inReplyTo?: string;
  /** Message-ID chain */
  references?: string[];

  /* MIME & transport diagnostics */
  /** Typically “1.0” */
  mimeVersion: string;
  /** Top-level type/subtype */
  contentType: string;
  /** Declared charset */
  charset?: string;
  /** 7bit/8bit/qp/base64 */
  contentTransferEncoding?: string;
  /** Per-message DKIM result */
  dkimStatus: 'pass' | 'fail' | 'missing';
  /** SPF evaluation */
  spfStatus: 'pass' | 'fail' | 'neutral';

  /* Body & parts */
  /** Renderable part ids */
  bodyParts: {
    /** Preferred text/plain part id */
    textPartId?: string;
    /** Preferred text/html part id */
    htmlPartId?: string;
  };
  /** Non-body MIME leaves */
  attachments: AttachmentMeta[];

  /* Storage */
  /** Entire raw RFC 822 */
  contents: Uint8Array;
  /** Null = active, ISO timestamp = trashed */
  deletedAt?: string;
}
