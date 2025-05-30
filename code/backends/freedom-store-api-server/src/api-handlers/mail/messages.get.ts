import { makeFailure, makeSuccess } from 'freedom-async';
import { base64String, type IsoDateTime } from 'freedom-basic-data';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { type DbMessage, dbQuery, type MessageFolder } from 'freedom-db'; // Removed FindManyMessagesCursor, findManyMessages
import { type EmailUserId, emailUserIdInfo } from 'freedom-email-sync';
import { type PageToken, pageTokenInfo } from 'freedom-paginated-data';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import type { types } from 'freedom-store-api-server-api';
import { api } from 'freedom-store-api-server-api';

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

function decodePageToken(pageToken: PageToken | undefined): DbQueryCursor | undefined {
  if (pageToken === undefined) {
    return undefined;
  }
  try {
    const rawTokenData = pageTokenInfo.removePrefix(pageToken);
    const decodedString = Buffer.from(rawTokenData, 'base64').toString('utf-8');
    const tokenPayload = JSON.parse(decodedString) as PageTokenPayload;
    // TOOO: Schema validation
    // if (!tokenPayload.id || !tokenPayload.transferredAt) {
    //   return undefined;
    // }
    return tokenPayload;
  } catch {
    return undefined;
  }
}

// Interface representing the raw row structure from the 'messages' table (camelCase due to quoted identifiers in SQL)
interface MessageDbRow {
  id: string;
  userId: EmailUserId;
  transferredAt: IsoDateTime;
  folder: MessageFolder;
  listMessage: Buffer; // Will be converted to Uint8Array
  viewMessage: Buffer; // Will be converted to Uint8Array
  rawMessage: Buffer; // Will be converted to Uint8Array
}

function getUserIdFromAuthorizationHeader(headers: Record<string, string> | undefined): EmailUserId | undefined {
  const authorizationHeader = headers?.authorization;
  if (authorizationHeader === undefined || !authorizationHeader.startsWith('Bearer ')) {
    return undefined;
  }
  return emailUserIdInfo.parse(authorizationHeader, 7)?.value;
}

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.mail.messages.GET },
  async (
    trace,
    {
      input: {
        headers,
        query: { pageToken }
      }
      // auth // Assuming auth.userId is available from the handler context
    }
  ) => {
    // TODO: Get userId from actual auth context
    const currentUserId = getUserIdFromAuthorizationHeader(headers);
    if (currentUserId === undefined) {
      return makeFailure(new InputSchemaValidationError(trace, { message: 'User ID not found in auth context' }));
    }

    // TODO: The API definition (api.mail.messages.GET) should be updated to accept `folder` as a query parameter.
    // For now, hardcoding to 'inbox'.
    const currentFolder: MessageFolder = 'inbox';

    const cursor = decodePageToken(pageToken);

    // Construct the database query
    const params: unknown[] = [currentUserId, currentFolder];
    let cursorClause = '';

    if (cursor !== undefined) {
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

    const dbMessages: DbMessage[] = messagesResult.rows.map(
      (row: MessageDbRow): DbMessage => ({
        id: row.id,
        userId: row.userId,
        transferredAt: row.transferredAt,
        folder: row.folder,
        listMessage: new Uint8Array(row.listMessage),
        viewMessage: new Uint8Array(row.viewMessage),
        rawMessage: new Uint8Array(row.rawMessage)
      })
    );

    const totalCount = parseInt(countResult.rows[0]?.total_count?.toString() ?? '0', 10);

    const hasMoreItems = dbMessages.length > PAGE_SIZE;
    const itemsForResponse = hasMoreItems ? dbMessages.slice(0, PAGE_SIZE) : dbMessages;

    const responseItems = itemsForResponse.map(
      (dbMsg: DbMessage): types.mail.ListMessage => ({
        id: dbMsg.id,
        transferredAt: dbMsg.transferredAt,
        listMessage: base64String.makeWithBuffer(dbMsg.listMessage),
        // TODO: Determine `hasAttachments` from DbMessage content or schema if needed.
        hasAttachments: false
      })
    );

    let nextPageToken: PageToken | undefined;
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
