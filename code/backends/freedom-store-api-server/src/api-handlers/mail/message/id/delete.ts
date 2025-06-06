import { makeFailure, makeSuccess } from 'freedom-async';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { dbQuery } from 'freedom-db';
import { api } from 'freedom-email-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';

import { getUserIdFromAuthorizationHeader } from '../../../../internal/utils/getUserIdFromAuthorizationHeader.ts';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.message.id.DELETE },
  async (
    trace,
    {
      input: {
        headers,
        params: { mailId }
      }
    }
  ) => {
    const currentUserId = getUserIdFromAuthorizationHeader(headers);
    if (currentUserId === undefined) {
      return makeFailure(
        new InputSchemaValidationError(trace, {
          message: 'User ID not found in auth context',
          errorCode: 'not-found'
        })
      );
    }

    // TODO: Bounce if not a draft

    // Construct the delete query
    // This will delete an existing message only if it belongs to the current user
    const deleteQuery = `
      DELETE FROM "messages"
      WHERE "id" = $1 AND "userId" = $2
      RETURNING "id"
    `;

    const params = [mailId, currentUserId];

    const result = await dbQuery<{ id: string }>(deleteQuery, params);

    // If no row was deleted, the message doesn't exist or doesn't belong to the user
    if (result.rows.length === 0) {
      return makeFailure(
        new InputSchemaValidationError(trace, {
          message: 'Message not found or access denied',
          errorCode: 'not-found'
        })
      );
    }

    // Return success with deleted flag
    return makeSuccess({
      body: {
        deleted: true
      }
    });
  }
);
