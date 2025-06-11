import { makeFailure, makeSuccess } from 'freedom-async';
import type { IsoDateTime } from 'freedom-basic-data';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import { type DbMessageOut, dbQuery, identifyThread } from 'freedom-db';
import { type MailThreadId, mailThreadIdInfo, type MessageFolder } from 'freedom-email-api';
import { api } from 'freedom-email-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';

import { getUserIdFromAuthorizationHeader } from '../../../../internal/utils/getUserIdFromAuthorizationHeader.ts';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.message.id.PUT },
  async (
    trace,
    {
      input: {
        headers,
        params: { mailId },
        body
      }
    }
  ) => {
    const currentUserId = getUserIdFromAuthorizationHeader(headers);
    if (currentUserId === undefined) {
      return makeFailure(new InputSchemaValidationError(trace, { message: 'User ID not found in auth context' }));
    }

    // Prepare message data for update
    const now = new Date();

    // Identify thread. On update, we refresh threadId but preserve messageId
    const threadResult = await identifyThread(trace, {
      inReplyTo: body.inReplyTo, // No option to preserve, always update, see ApiInputMessage.inReplyTo comment
      references: [] // Not used for internally-updated messages
    });
    if (!threadResult.ok) {
      return threadResult;
    }

    let threadId: MailThreadId;

    // This means that the message must be detached from any existing thread
    if (threadResult.value !== null) {
      threadId = threadResult.value;
    } else {
      // Check if the existing message has a unique threadId and get it
      const uniqueCheckQuery = `
        SELECT m."threadId"
        FROM "messages" m
        WHERE m."id" = $1 AND m."userId" = $2
          AND NOT EXISTS (
            SELECT 1
            FROM "messages" m2
            WHERE m2."threadId" = m."threadId" AND m2."id" != $1
          )
      `;

      const uniqueCheckResult = await dbQuery<{ threadId: MailThreadId }>(uniqueCheckQuery, [mailId, currentUserId]);

      if (uniqueCheckResult.rows.length > 0) {
        // The existing threadId is unique to this message, so we can reuse it
        threadId = uniqueCheckResult.rows[0].threadId;
      } else {
        // It is filtered out so it is not unique, generate a new one
        threadId = mailThreadIdInfo.make(makeUuid());
      }
    }

    // Folder is 'drafts' for user-created/updated messages
    const folder: MessageFolder = 'drafts';

    // TODO: Return error if the message doesn't exist, or belong to another user, or is not a draft
    // Construct the update query
    // This will update an existing record only
    const updateQuery = `
      UPDATE "messages"
      SET
        "updatedAt" = $3,
        "listFields" = $5,
        "viewFields" = $6,
        "threadId" = $7
      WHERE "id" = $1 AND "userId" = $2 AND "folder" = $4
      RETURNING "updatedAt"
    `;

    const params = [mailId, currentUserId, now, folder, body.listFields, body.viewFields, threadId];

    const result = await dbQuery<Pick<DbMessageOut, 'id' | 'updatedAt'>>(updateQuery, params);

    const dbMsg = result.rows[0];

    // If no row was updated, the message doesn't exist
    if (dbMsg === undefined) {
      // TODO: Handle somehow
    }

    // Return the updated message with server-generated fields
    return makeSuccess({
      body: {
        updatedAt: dbMsg.updatedAt.toISOString() as IsoDateTime,
        threadId
      }
    });
  }
);
