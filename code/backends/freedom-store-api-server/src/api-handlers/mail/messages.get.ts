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
  listMessage:
    'B64_AAEAAAA3Q1JZUFRPS0VZU0VUX2NvbWJvLTc0NDFiNjYzLWRlMDQtNDg1Ny1hYmRmLWM3ZjZhMmMwOTIxOQEDYswohVo3kkImiS1OH92O0TunlaGV4ZvFtujYLdphsJF9W4zfjjuqDzHy5cvmKG+tS6KmeL7ImwQUj5tLXeiG4aU8GbAuKKwmVdVBip4Np99J4B9tsYLElm51v77NhYPnyyP0fuK4IIaWr+8sYuWplBtMyBmGNvB2XaL+fGyuWMxJR2FcHUoS0fDd0rpRn473aBXVUu4b7sqvi+MQHNlbqLqb08f57rK1rbgDhaSSeP83zFVs3o1rWmcXCsdadUUTEdozgbTEUvNuNPSUn0b/s8fzLuC/aWzYmEYQz/DlddW4cEvShLdnZCtZjIW6QZFMZA4IYS0RyWsdm5as+8X5XD7eLLP63HvVB/RAsbA6zFPqoKYurIATzAeg0GE0Ga8wCe6ZLSYwoVVxQnRnqYD4Y+P7kljc8yEILT4gk3pLozJrkiFxfCmTsqb5Ct1fAHOqpf04BOOfR+iPSM2LtLuslsXMDu5qUzqxUC3fNhEyhA2aR2dpYfORwU9mONRPDy6nmfMwy7oaUH6eulcx1o3rEdknP/miycZouFKBOEiG+64Agu8CM3kkYgKHwG1QClcGhndhPP/ZHRxQzfx+5dssIvcrI8c85ukVGRFlRI9amwElM3RcFFqANtek2fg+6YChPi1ESeH/0/k048UQQydSIlC4KnkVG3a8w3DhfzwdwA==',
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
