import { makeFailure, makeSuccess } from 'freedom-async';
import type { IsoDateTime } from 'freedom-basic-data';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { type DbMessageOut, dbQuery } from 'freedom-db';
import { api, type types } from 'freedom-email-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';

import { getUserIdFromAuthorizationHeader } from '../../internal/utils/getUserIdFromAuthorizationHeader.ts';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.messagesIdPut.PUT },
  async (
    trace,
    {
      input: {
        headers,
        params: { messageId },
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

    // Folder is 'drafts' for user-created/updated messages
    const folder: types.MessageFolder = 'drafts';

    // TODO: Return error if the message doesn't exist, or belong to another user, or is not a draft
    // Construct the update query
    // This will update an existing record only
    const updateQuery = `
      UPDATE "messages"
      SET 
        "updatedAt" = $3,
        "listFields" = $5,
        "viewFields" = $6
      WHERE "id" = $1 AND "userId" = $2 AND "folder" = $4
      RETURNING "updatedAt"
    `;

    const params = [messageId, currentUserId, now, folder, body.listFields, body.viewFields];

    const result = await dbQuery<Pick<DbMessageOut, 'id' | 'updatedAt'>>(updateQuery, params);

    const dbMsg = result.rows[0];

    // If no row was updated, the message doesn't exist
    if (dbMsg === undefined) {
      // TODO: Handle somehow
    }

    // Return the updated message with server-generated fields
    return makeSuccess({
      body: {
        updatedAt: dbMsg.updatedAt.toISOString() as IsoDateTime
      }
    });
  }
);
