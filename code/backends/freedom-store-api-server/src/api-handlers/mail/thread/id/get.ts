import { makeFailure, makeSuccess } from 'freedom-async';
import { type IsoDateTime } from 'freedom-basic-data';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { type DbMessageOut, dbQuery } from 'freedom-db';
import type { ApiViewMessage } from 'freedom-email-api';
import { api, mailIdInfo } from 'freedom-email-api';
import { DEFAULT_PAGE_SIZE, type PageToken, pageTokenInfo } from 'freedom-paginated-data';
import { makeHttpApiHandler } from 'freedom-server-api-handling';

import { decodePageToken, type PageTokenPayload } from '../../../../internal/utils/decodePageToken.ts';
import { getMessageById } from '../../../../internal/utils/getMessageById.ts';
import { getUserIdFromAuthorizationHeader } from '../../../../internal/utils/getUserIdFromAuthorizationHeader.ts';

// Constants
const PAGE_SIZE = DEFAULT_PAGE_SIZE;

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.thread.id.GET },
  async (
    trace,
    {
      input: {
        headers,
        params: { threadLikeId },
        query: { pageToken }
      }
    }
  ) => {
    const currentUserId = getUserIdFromAuthorizationHeader(headers);
    if (currentUserId === undefined) {
      return makeFailure(new InputSchemaValidationError(trace, { message: 'User ID not found in auth context' }));
    }

    // --- Handling Single Message Case ---

    // A thread here can represent a real thread or a single message.  If it's a single message, using getMessageById instead
    if (mailIdInfo.is(threadLikeId)) {
      const mailId = threadLikeId;
      const message = await getMessageById(trace, { mailId, userId: currentUserId });
      if (!message.ok) {
        return message;
      }

      return makeSuccess({ body: { items: [message.value], estCount: 1 } });
    }

    // ---

    const threadId = threadLikeId;

    const cursor = decodePageToken(pageToken);

    // Construct the database query
    const params: unknown[] = [currentUserId, threadId];
    let cursorClause = '';

    if (cursor !== undefined) {
      params.push(cursor.updatedAt, cursor.id);
      cursorClause = `AND ("updatedAt" < $${params.length - 1} OR ("updatedAt" = $${params.length - 1} AND "id" < $${params.length}))`;
    }

    // Fetch one extra item to determine if there's a next page
    params.push(PAGE_SIZE + 1);
    const messagesQuery = `
      SELECT "id", "userId", "updatedAt", "messageId", "threadId", "listFields", "viewFields"
      FROM "messages"
      WHERE "userId" = $1 AND "threadId" = $2
      ${cursorClause}
      ORDER BY "updatedAt" DESC, "id" DESC
      LIMIT $${params.length}
    `;

    const countQuery = `
      SELECT COUNT(*)::int as total_count
      FROM "messages"
      WHERE "userId" = $1 AND "id" = $2
    `;

    // Execute queries (errors will bubble up and be handled by makeHttpApiHandler)
    const [messagesResult, countResult] = await Promise.all([
      dbQuery<Pick<DbMessageOut, 'id' | 'userId' | 'updatedAt' | 'messageId' | 'threadId' | 'listFields' | 'viewFields'>>(
        messagesQuery,
        params
      ),
      dbQuery<{ total_count: number }>(countQuery, [currentUserId, threadId])
    ]);

    const dbMessages = messagesResult.rows;

    const totalCount = countResult.rows[0]?.total_count ?? 0;

    const hasMoreItems = dbMessages.length > PAGE_SIZE;
    const itemsForResponse = hasMoreItems ? dbMessages.slice(0, PAGE_SIZE) : dbMessages;

    const responseItems = itemsForResponse.map(
      (dbMsg): ApiViewMessage => ({
        id: dbMsg.id,
        updatedAt: dbMsg.updatedAt.toISOString() as IsoDateTime,
        messageId: dbMsg.messageId,
        // threadId: dbMsg.threadId, - we could, but shall we?
        listFields: dbMsg.listFields,
        viewFields: dbMsg.viewFields
        // TODO: attachmentsSummarya
      })
    );

    let nextPageToken: PageToken | undefined;
    if (hasMoreItems && responseItems.length > 0) {
      const lastItemOnPage = responseItems[responseItems.length - 1];
      const nextCursorPayload: PageTokenPayload = {
        id: lastItemOnPage.id,
        updatedAt: lastItemOnPage.updatedAt
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
