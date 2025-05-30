import { makeFailure, makeSuccess } from 'freedom-async';
import type { IsoDateTime } from 'freedom-basic-data';
import { pageTokenInfo } from 'freedom-paginated-data';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import type { types } from 'freedom-store-api-server-api';
import { api } from 'freedom-store-api-server-api';
import { dbQuery, type DbMessage, type MessageFolder } from 'freedom-db'; // Removed FindManyMessagesCursor, findManyMessages
import { Buffer } from 'node:buffer'; // For base64 encoding/decoding
import { InvalidArgumentError } from 'freedom-common-errors';

// Constants
const PAGE_SIZE = 10;

// For parsing the pageToken from the request
interface PageTokenPayload {
  id: string;
  transferredAt: IsoDateTime;
}

// For constructing the cursor for database query
interface DbQueryCursor {
  transferredAt: IsoDateTime;
  id: string;
}

// Interface representing the raw row structure from the 'messages' table (camelCase due to quoted identifiers in SQL)
interface MessageDbRow {
  id: string;
  userId: string; // Raw userId string from DB, will be mapped to DbMessage.userId object
  transferredAt: Date; // Will be converted to IsoDateTime string
  folder: MessageFolder;
  listMessage: Buffer; // Will be converted to Uint8Array
  viewMessage: Buffer; // Will be converted to Uint8Array
  rawMessage: Buffer; // Will be converted to Uint8Array
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
    const currentUserId = auth?.userId;
    if (!currentUserId) {
      return makeFailure(new InvalidArgumentError(trace, { message: 'User ID not found in auth context' }));
    }

    // TODO: The API definition (api.mail.messages.GET) should be updated to accept `folder` as a query parameter.
    // For now, hardcoding to 'inbox'.
    const currentFolder: MessageFolder = 'inbox';

    let cursor: DbQueryCursor | undefined;
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

    // Construct the database query
    const params: unknown[] = [currentUserId, currentFolder];
    let cursorClause = '';

    if (cursor) {
      params.push(cursor.transferredAt, cursor.id);
      cursorClause = `AND ("transferredAt" < $${params.length - 1} OR ("transferredAt" = $${params.length - 1} AND "id" < $${params.length}))`;
    }

    // Fetch one extra item to determine if there's a next page
    params.push(PAGE_SIZE + 1);
    const messagesQuery = `
      SELECT "id", "userId", "transferredAt", "folder", "listMessage", "viewMessage", "rawMessage"
      FROM "messages"
      WHERE "userId" = $1 AND "folder" = $2
      ${cursorClause}
      ORDER BY "transferredAt" DESC, "id" DESC
      LIMIT $${params.length}
    `;

    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM "messages"
      WHERE "userId" = $1 AND "folder" = $2
    `;

    // Execute queries (errors will bubble up and be handled by makeHttpApiHandler)
    const [messagesResult, countResult] = await Promise.all([
      dbQuery<MessageDbRow>(messagesQuery, params),
      dbQuery<{ total_count: string | number }>(countQuery, [currentUserId, currentFolder])
    ]);

    const dbMessages: DbMessage[] = messagesResult.rows.map((row: MessageDbRow): DbMessage => ({
      id: row.id,
      userId: { id: row.userId, type: 'email' }, // Assuming type is always 'email'
      transferredAt: row.transferredAt.toISOString() as IsoDateTime,
      folder: row.folder,
      listMessage: new Uint8Array(row.listMessage),
      viewMessage: new Uint8Array(row.viewMessage),
      rawMessage: new Uint8Array(row.rawMessage)
    }));

    const totalCount = parseInt(countResult.rows[0]?.total_count?.toString() ?? '0', 10);

    const hasMoreItems = dbMessages.length > PAGE_SIZE;
    const itemsForResponse = hasMoreItems ? dbMessages.slice(0, PAGE_SIZE) : dbMessages;

    const responseItems = itemsForResponse.map((dbMsg: DbMessage): types.mail.ListMessage => ({
      id: dbMsg.id,
      transferredAt: dbMsg.transferredAt,
      listMessage: Buffer.from(dbMsg.listMessage).toString('base64'),
      // TODO: Determine `hasAttachments` from DbMessage content or schema if needed.
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
