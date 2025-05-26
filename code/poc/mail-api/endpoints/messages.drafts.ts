import type { Message } from '../models/message/Message';
import type { ViewMessage } from '../models/message/ViewMessage';

/** Sub-set of {@link Message} fields accepted when creating or editing an unsent
 *  message (draft). It deliberately omits server-controlled data such as ids,
 *  timestamps, labels and transport diagnostics. */
export type DraftPayload = Pick<
  Message,
  | 'subject'
  | 'from'
  | 'to'
  | 'cc'
  | 'bcc'
  | 'replyTo'
  | 'bodyParts'
  | 'attachments'
  | 'inReplyTo'
  | 'references'
>;

/** Endpoints that act on messages kept in “draft” state.  The URL space does
 *  not expose a separate /drafts branch; drafts live under the same /messages
 *  prefix and are distinguished by the fact that {@link Message.isDraft}
 *  remains true until they are sent. */
export type DraftsAPI = {
  /** Create a new unsent message.  The server returns the full message view
   *  with `isDraft` === true. */
  'POST /messages': {
    /** Initial content of the unsent message. */
    body: DraftPayload;
    /** Newly created draft */
    response: ViewMessage;
  };

  /** Retrieve the current content of an unsent message for editing. */
  'GET /messages/{messageId}': {
    params: {
      /** Identifier of the unsent message */
      messageId: string;
    };
    /** Full projection of the unsent message */
    response: ViewMessage;
  };

  /** Replace the content of an existing unsent message. */
  'PUT /messages/{messageId}': {
    params: {
      /** Identifier of the unsent message */
      messageId: string;
    };
    /** New content, entire object is up-serted */
    body: DraftPayload;
    /** Updated draft */
    response: ViewMessage;
  };

  /** Permanently remove an unsent message. */
  'DELETE /messages/{messageId}': {
    params: {
      /** Identifier of the unsent message */
      messageId: string;
    };
    response: {
      /** true ⇒ deletion succeeded */
      deleted: boolean;
    };
  };

  /** Finalise and dispatch an existing unsent message.  After this call the
   *  record becomes a normal, sent message with `isDraft` === false. */
  'POST /messages/{messageId}/send': {
    params: {
      /** Identifier of the unsent message to dispatch */
      messageId: string;
    };
    response: {
      /** Conversation container now holding the sent item */
      threadId: string;
      /** Identifier of the sent message (same as input id) */
      messageId: string;
      /** Server timestamp of delivery (RFC 3339) */
      date: string;
    };
  };
};
