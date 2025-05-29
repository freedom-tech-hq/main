import type { Thread } from '../models/thread/Thread';
import type { ViewMessage } from '../models/message/ViewMessage';
import type { PaginationOutput } from '../models/technical/PaginationOutput';

/** REST contract for every thread-related operation. */
export type ThreadsAPI = {
  /** List threads visible to the signed-in user. */
  'GET /threads': {
    query: {
      /** Opaque cursor from the previous slice; omit for first page */
      cursor?: string;
      /** Maximum number of threads to return */
      limit?: number;
      /** Filter by label id (system or user) */
      labelId?: string;
      /** Gmail-like search grammar (from:, subject:, before:, …) */
      q?: string;
      /** Sort criterion for listing */
      sort?: 'date' | 'sender';
    };
    response: PaginationOutput<Thread>;
  };

  /** Fetch a single thread together with all its messages. */
  'GET /threads/{threadId}': {
    params: {
      /** Opaque thread id */
      threadId: string;
    };
    response: {
      /** Thread metadata */
      thread: Thread;
      /** Messages ordered by internalDate ascending */
      messages: ViewMessage[];
    };
  };

  /** Mute or unmute a thread to control future notifications. */
  'PUT /threads/{threadId}/mute': {
    params: {
      /** Opaque thread id */
      threadId: string;
    };
    body: {
      /** true ⇒ mute, false ⇒ unmute */
      isMuted: boolean;
    };
    response: Thread;
  };
};
