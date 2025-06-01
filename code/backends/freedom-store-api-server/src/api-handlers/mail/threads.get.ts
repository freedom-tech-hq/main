import { makeFailure, makeSuccess } from 'freedom-async';
import type { IsoDateTime } from 'freedom-basic-data';
import { InputSchemaValidationError } from 'freedom-common-errors';
import type { MessageFolder } from 'freedom-db';
import { dbQuery } from 'freedom-db';
import type { EmailUserId } from 'freedom-email-sync';
import { emailUserIdInfo } from 'freedom-email-sync';
import type { PageToken } from 'freedom-paginated-data';
import { pageTokenInfo } from 'freedom-paginated-data';
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
  { api: api.mail.threads.GET },
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

    // For now, hardcoding to 'inbox'
    const currentFolder: MessageFolder = 'inbox';

    const cursor = decodePageToken(pageToken);

    // Construct the database query to get threads
    const params: unknown[] = [currentUserId, currentFolder];
    let cursorClause = '';

    if (cursor !== undefined) {
      params.push(cursor.transferredAt, cursor.id);
      cursorClause = `AND ("transferredAt" < $${params.length - 1} OR ("transferredAt" = $${params.length - 1} AND "id" < $${params.length}))`;
    }

    // Fetch one extra item to determine if there's a next page
    params.push(PAGE_SIZE + 1);
    const threadsQuery = `
      SELECT 
        "threadId" as "id", 
        MAX("transferredAt") as "transferredAt", 
        COUNT(*) as "messageCount",
        FIRST_VALUE("listFields") OVER (PARTITION BY "threadId" ORDER BY "transferredAt" DESC) as "listFields",
        BOOL_OR("hasAttachments") as "hasAttachments"
      FROM "messages"
      WHERE "userId" = $1 AND "folder" = $2 AND "threadId" IS NOT NULL
      GROUP BY "threadId"
      ${cursorClause ? `HAVING ${cursorClause.replace(/transferredAt/g, 'MAX("transferredAt")')}` : ''}
      ORDER BY MAX("transferredAt") DESC, "threadId" DESC
      LIMIT $${params.length}
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT "threadId") as total_count
      FROM "messages"
      WHERE "userId" = $1 AND "folder" = $2 AND "threadId" IS NOT NULL
    `;

    // Execute queries
    const [threadsResult, countResult] = await Promise.all([
      dbQuery<{
        id: string;
        transferredAt: IsoDateTime;
        messageCount: number;
        listFields: string;
        hasAttachments: boolean;
      }>(threadsQuery, params),
      dbQuery<{ total_count: number }>(countQuery, [currentUserId, currentFolder])
    ]);

    const dbThreads = threadsResult.rows;

    const totalCount = countResult.rows[0]?.total_count ?? 0;

    const hasMoreItems = dbThreads.length > PAGE_SIZE;
    const itemsForResponse = hasMoreItems ? dbThreads.slice(0, PAGE_SIZE) : dbThreads;

    const responseItems = itemsForResponse.map(
      (dbThread): types.mail.Thread => ({
        id: dbThread.id,
        messageCount: dbThread.messageCount,
        transferredAt: dbThread.transferredAt,
        listFields: dbThread.listFields,
        hasAttachments: dbThread.hasAttachments
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
