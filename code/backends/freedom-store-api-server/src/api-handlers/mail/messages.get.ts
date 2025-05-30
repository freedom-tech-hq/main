import { makeFailure, makeSuccess } from 'freedom-async';
import type { IsoDateTime } from 'freedom-basic-data';
import { pageTokenInfo } from 'freedom-paginated-data';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import type { types } from 'freedom-store-api-server-api';
import { api } from 'freedom-store-api-server-api';
import { findManyMessages, type DbMessage, type MessageFolder, type FindManyMessagesCursor } from 'freedom-db';
import { Buffer } from 'node:buffer'; // For base64 encoding/decoding
import { NotFoundError, InvalidArgumentError } from 'freedom-common-errors';

// Constants
const PAGE_SIZE = 10;

interface PageTokenPayload {
  id: string;
  transferredAt: IsoDateTime;
}

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.mail.messages.GET },
  async (
    trace,
    {
      input: {
        query: { pageToken }
      },
      auth // Assuming auth.userId is available from the handler context
    }
  ) => {
    // TODO: Get userId from actual auth context
    const userId = auth?.userId;
    if (!userId) {
      return makeFailure(new InvalidArgumentError(trace, { message: 'User ID not found in auth context' }));
    }

    // TODO: The API definition (api.mail.messages.GET) should be updated to accept `folder` as a query parameter.
    // For now, hardcoding to 'inbox'.
    const folder: MessageFolder = 'inbox';

    let cursor: FindManyMessagesCursor | undefined;
    if (pageToken) {
      try {
        const rawTokenData = pageTokenInfo.removePrefix(pageToken);
        const decodedString = Buffer.from(rawTokenData, 'base64').toString('utf-8');
        const tokenPayload = JSON.parse(decodedString) as PageTokenPayload;
        if (!tokenPayload.id || !tokenPayload.transferredAt) {
          return makeFailure(new InvalidArgumentError(trace, { message: 'Invalid page token payload' }));
        }
        cursor = tokenPayload;
      } catch (error) {
        return makeFailure(new InvalidArgumentError(trace, { message: 'Failed to parse page token', cause: error }));
      }
    }

    // Fetch one extra item to determine if there's a next page
    const result = await findManyMessages(trace, userId, folder, PAGE_SIZE + 1, cursor);

    if (!result.ok) {
      // Pass through the error from findManyMessages
      return result;
    }

    const { items: dbMessages, totalCount } = result.value;

    const hasMoreItems = dbMessages.length > PAGE_SIZE;
    const itemsForResponse = hasMoreItems ? dbMessages.slice(0, PAGE_SIZE) : dbMessages;

    const responseItems: types.mail.ListMessage[] = itemsForResponse.map((dbMsg: DbMessage) => ({
      id: dbMsg.id,
      transferredAt: dbMsg.transferredAt,
      listMessage: Buffer.from(dbMsg.listMessage).toString('base64'),
      // TODO: Determine `hasAttachments` from DbMessage content or schema if needed.
      // This field is part of the API contract (types.mail.ListMessage).
      hasAttachments: false, 
    }));

    let nextPageToken: string | undefined;
    if (hasMoreItems && responseItems.length > 0) {
      const lastItemOnPage = responseItems[responseItems.length - 1];
      const nextCursorPayload: PageTokenPayload = {
        id: lastItemOnPage.id,
        transferredAt: lastItemOnPage.transferredAt
      };
      const nextPageTokenString = Buffer.from(JSON.stringify(nextCursorPayload)).toString('base64');
      nextPageToken = pageTokenInfo.make(nextPageTokenString);
    }

    return makeSuccess({
      body: {
        items: responseItems,
        estCount: totalCount,
        nextPageToken
      }
    });
  }
);
