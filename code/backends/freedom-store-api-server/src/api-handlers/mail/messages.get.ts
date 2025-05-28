import { makeSuccess } from 'freedom-async';
import type { IsoDateTime } from 'freedom-basic-data';
import { pageTokenInfo } from 'freedom-paginated-data';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import type { types } from 'freedom-store-api-server-api';
import { api } from 'freedom-store-api-server-api';

// Constants
const PAGE_SIZE = 10;

// Generate sample messages for testing - ordered by transferredAt descending (newest first)
const db: types.mail.ListMessage[] = Array.from({ length: 30 }, (_, i) => ({
  id: `msg-${i + 1}`,
  transferredAt: new Date(Date.now() - i * 3600000).toISOString() as IsoDateTime, // Each message 1 hour apart
  listMessage: new Uint8Array(),
  // subject: `Test Message ${i + 1}`,
  // snippet: `This is a test message ${i + 1} with some sample content...`,
  hasAttachments: i % 3 === 0 // Every third message has attachments
}));

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.mail.messages.GET },
  async (
    _trace,
    {
      input: {
        query: { pageToken }
      }
    }
  ) => {
    // Extract message ID from token if present (token format is already validated by schema)
    const lastMessageId = pageToken !== undefined ? pageTokenInfo.removePrefix(pageToken) : null;

    // Find starting position for this page
    let startIndex = 0;

    if (lastMessageId !== null) {
      // Use Map for O(1) lookup if this were a production app with many messages
      // For this mock implementation with 30 messages, findIndex is fine
      const lastMessageIndex = db.findIndex((message) => message.id === lastMessageId);
      if (lastMessageIndex !== -1) {
        startIndex = lastMessageIndex + 1;
      }
    }

    // Get items for current page - guaranteed to be O(1) with V8's implementation of slice
    const items = db.slice(startIndex, startIndex + PAGE_SIZE);

    // Determine if we need to provide a next page token
    const hasMoreItems = startIndex + PAGE_SIZE < db.length;

    // Only create a token if we have items and there are more to fetch
    const nextPageToken = hasMoreItems && items.length > 0 ? pageTokenInfo.make(items[items.length - 1].id) : undefined;

    return makeSuccess({
      body: {
        items,
        estCount: db.length,
        nextPageToken
      }
    });
  }
);
