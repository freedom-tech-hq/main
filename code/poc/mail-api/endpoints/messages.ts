import type { PaginationInput } from '../models/technical/PaginationInput';
import type { PaginationOutput } from '../models/technical/PaginationOutput';
import type { ListMessage } from '../models/message/ListMessage';
import type { ViewMessage } from '../models/message/ViewMessage';

/** REST contract for every message-related operation. */
export type MessagesAPI = {
  /** List messages as a flat, non-threaded feed. */
  'GET /messages': {
    query: ({
      /** Filter by a single label id */
      labelId?: string;
      /** Gmail-style search grammar (from:, subject:, before:, …) */
      q?: string;
      /** Sort order for the list */
      sort?: 'date' | 'sender';
    } & PaginationInput);
    response: PaginationOutput<ListMessage>;
  };

  /** Fetch a single message with headers, body part ids, and attachment metadata. */
  'GET /messages/{messageId}': {
    params: {
      /** Opaque message id */
      messageId: string;
    };
    response: ViewMessage;
  };

  /** Atomically add / remove labels on a message. */
  'PUT /messages/{messageId}/labels': {
    params: {
      /** Target message id */
      messageId: string;
    };
    body: {
      /** Labels to add */
      add: string[];
      /** Labels to remove */
      remove: string[];
    };
    response: ViewMessage;
  };

  /** Toggle unread status (maps to system label UNREAD). */
  'PUT /messages/{messageId}/unread': {
    params: {
      /** Target message id */
      messageId: string;
    };
    body: {
      /** true ⇒ mark unread, false ⇒ mark read */
      isUnread: boolean;
    };
    response: ViewMessage;
  };

  /** Send a new message or a reply. */
  'POST /messages/send': {
    body: {
      /** Primary recipients */
      to: string[];
      /** Message subject */
      subject: string;
      /** Body content */
      body: {
        /** Plain-text body */
        text?: string;
        /** HTML body */
        html?: string;
      };
      /** Carbon copy recipients */
      cc?: string[];
      /** Blind carbon copy recipients */
      bcc?: string[];
      /** Message-ID being replied to */
      inReplyTo?: string;
      /** Thread reference chain */
      references?: string[];
      /** File attachments, Base64url encoded */
      attachments?: {
        /** File name */
        filename: string;
        /** MIME type */
        mimeType: string;
        /** Base64url data */
        content: string;
      }[];
    };
    response: {
      /** Created thread id */
      threadId: string;
      /** Created message id */
      messageId: string;
      /** Server timestamp of send */
      date: string;
    };
  };

  /** Bulk add / remove labels or mark read/unread on many messages. */
  'POST /messages/batchModify': {
    body: {
      /** List of message ids to modify (max server limit, e.g. 1000) */
      messageIds: string[];
      /** Labels to add to each message */
      addLabelIds?: string[];
      /** Labels to remove from each message */
      removeLabelIds?: string[];
      /** Optional unread toggle applied to all */
      markUnread?: boolean;
    };
    response: {
      /** Number of messages modified */
      modified: number;
    };
  };

  /** Delete or trash many messages at once. */
  'POST /messages/batchDelete': {
    body: {
      /** Message ids to delete */
      messageIds: string[];
      /** true ⇒ permanent delete, false ⇒ move to Trash */
      permanent?: boolean;
    };
    response: {
      /** Number of messages deleted */
      deleted: number;
    };
  };

  /** Stream a binary attachment part. */
  'GET /messages/{messageId}/attachments/{partId}': {
    params: {
      /** Host message id */
      messageId: string;
      /** MIME part id */
      partId: string;
    };
    response: ArrayBuffer;
  };

  /** Import a raw RFC-822 message into the mailbox. */
  'POST /messages/import': {
    body: {
      /** Base64url-encoded full RFC 822 message */
      raw: string;
    };
    response: ViewMessage;
  };

  /** Schedule a message to be sent at a future time. */
  'POST /messages/sendScheduled': {
    body: {
      /** Normal send payload without the date field */
      to: string[];
      subject: string;
      body: {
        text?: string;
        html?: string;
      };
      cc?: string[];
      bcc?: string[];
      inReplyTo?: string;
      references?: string[];
      attachments?: {
        filename: string;
        mimeType: string;
        content: string;
      }[];
      /** RFC 3339 timestamp when the server should send */
      sendAt: string;
    };
    response: {
      /** Scheduled message id */
      messageId: string;
      /** Thread id of the scheduled message */
      threadId: string;
      /** Scheduled datetime ISO string */
      scheduledAt: string;
    };
  };

  /** Snooze one or more messages until a given time. */
  'POST /messages/snooze': {
    body: {
      /** Messages to snooze */
      messageIds: string[];
      /** When to unsnooze (RFC 3339) */
      until: string;
    };
    response: {
      /** Number of messages snoozed */
      snoozed: number;
    };
  };

  /** Undo a recently sent message (within the grace window). */
  'POST /messages/undoSend': {
    body: {
      /** Message id to recall */
      messageId: string;
    };
    response: ViewMessage;
  };

  /** Save a draft as a reusable template. */
  'POST /messages/template': {
    body: {
      /** Draft id to convert */
      draftId: string;
      /** Display name for the template */
      name: string;
    };
    response: {
      /** Created template id */
      templateId: string;
    };
  };
};
