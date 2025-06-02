import { makeFailure, makeSuccess } from 'freedom-async';
import type { IsoDateTime } from 'freedom-basic-data';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { type DbMessageOut, dbQuery } from 'freedom-db';
import { api, type types } from 'freedom-email-api';
import type { EmailUserId } from 'freedom-email-sync';
import { emailUserIdInfo } from 'freedom-email-sync';
import type { PageToken } from 'freedom-paginated-data';
import { pageTokenInfo } from 'freedom-paginated-data';
import { makeHttpApiHandler } from 'freedom-server-api-handling';

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

function getUserIdFromAuthorizationHeader(headers: Record<string, string> | undefined): EmailUserId | undefined {
  const authorizationHeader = headers?.authorization;
  if (authorizationHeader === undefined || !authorizationHeader.startsWith('Bearer ')) {
    return undefined;
  }
  return emailUserIdInfo.parse(authorizationHeader, 7)?.value;
}

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.threads.GET },
  async (
    trace,
    {
      input: {
        headers,
        query: { pageToken }
      }
    }
  ) => {
    // Get userId from authorization header
    const currentUserId = getUserIdFromAuthorizationHeader(headers);
    if (currentUserId === undefined) {
      return makeFailure(new InputSchemaValidationError(trace, { message: 'User ID not found in auth context' }));
    }

    // TODO: The API definition (api.mail.messages.GET) should be updated to accept `folder` as a query parameter.
    // For now, hardcoding to 'inbox'
    const currentFolder: types.MessageFolder = 'inbox';

    const cursor = decodePageToken(pageToken);

    // Construct the database query to get threads
    const params: unknown[] = [currentUserId, currentFolder];
    let cursorClause = '';

    if (cursor !== undefined) {
      params.push(cursor.transferredAt, cursor.id);
      cursorClause = `AND ("transferredAt" < $${params.length - 1} OR ("transferredAt" = $${params.length - 1} AND "id" < $${params.length}))`;
    }

    // Simplifying to one-message = one thread. TODO: implement threads, probably after adding an ORM
    // Fetch one extra item to determine if there's a next page
    params.push(PAGE_SIZE + 1);
    const messagesQuery = `
      SELECT "id", "userId", "transferredAt", "listFields"
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

    const countParams = [currentUserId, currentFolder];

    // Execute queries (errors will bubble up and be handled by makeHttpApiHandler)
    const [messagesResult, countResult] = await Promise.all([
      dbQuery<Pick<DbMessageOut, 'id' | 'userId' | 'transferredAt' | 'listFields'>>(messagesQuery, params),
      dbQuery<{ total_count: number }>(countQuery, countParams)
    ]);

    const dbMessages = messagesResult.rows;

    const totalCount = countResult.rows[0]?.total_count ?? 0;

    const hasMoreItems = dbMessages.length > PAGE_SIZE;
    const itemsForResponse = hasMoreItems ? dbMessages.slice(0, PAGE_SIZE) : dbMessages;

    const responseItems = itemsForResponse.map(
      (dbMsg): types.ApiThread => ({
        id: dbMsg.id,
        messageCount: 1,
        lastMessage: {
          id: dbMsg.id,
          transferredAt: dbMsg.transferredAt.toISOString() as IsoDateTime,
          listFields: dbMsg.listFields,
          hasAttachments: false
        }
      })
    );

    let nextPageToken: PageToken | undefined;
    if (hasMoreItems && responseItems.length > 0) {
      const lastItemOnPage = responseItems[responseItems.length - 1];
      const nextCursorPayload: PageTokenPayload = {
        id: lastItemOnPage.id,
        transferredAt: lastItemOnPage.lastMessage.transferredAt
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
