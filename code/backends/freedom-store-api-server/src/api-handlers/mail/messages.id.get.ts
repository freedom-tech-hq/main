import { makeFailure, makeSuccess } from 'freedom-async';
import type { IsoDateTime } from 'freedom-basic-data';
import { InputSchemaValidationError, NotFoundError } from 'freedom-common-errors';
import { type DbMessage, dbQuery } from 'freedom-db';
import { type EmailUserId, emailUserIdInfo } from 'freedom-email-sync';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { api, type types } from 'freedom-store-api-server-api';

// Helper to get userId (consistent with messages.get.ts) TODO: Extract shared
function getUserIdFromAuthorizationHeader(headers: Record<string, string> | undefined): EmailUserId | undefined {
  const authorizationHeader = headers?.authorization;
  if (authorizationHeader === undefined || !authorizationHeader.startsWith('Bearer ')) {
    return undefined;
  }
  return emailUserIdInfo.parse(authorizationHeader, 7)?.value;
}

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.mail.messagesId.GET },
  async (
    trace,
    {
      input: {
        headers,
        params: { messageId }
      }
    }
  ) => {
    const currentUserId = getUserIdFromAuthorizationHeader(headers);
    if (currentUserId === undefined) {
      return makeFailure(new InputSchemaValidationError(trace, { message: 'User ID not found in auth context' }));
    }

    const sql = `
      SELECT "id", "userId", "transferredAt", "listMessage", "viewMessage"
      FROM "messages"
      WHERE "id" = $1 AND "userId" = $2
    `;

    // Fetching listMessage and viewMessage as per the revised ViewMessage schema in the API definition.
    // Folder and rawMessage are not part of the revised ViewMessage schema.
    const result = await dbQuery<Pick<DbMessage, 'id' | 'userId' | 'transferredAt' | 'listMessage' | 'viewMessage'>>(sql, [
      messageId,
      currentUserId
    ]);

    if (result.rows.length === 0) {
      return makeFailure(
        new NotFoundError(trace, {
          errorCode: 'not-found',
          message: `Message with id ${messageId} not found`
        })
      );
    }

    const dbMsg = result.rows[0];

    // The ViewMessage schema in freedom-store-api-server-api (Step 177) now expects these as encrypted base64 strings.
    // No decryption is performed in this handler.
    const responseBody: types.mail.ViewMessage = {
      id: dbMsg.id,
      transferredAt: dbMsg.transferredAt.toISOString() as IsoDateTime,
      listMessage: dbMsg.listMessage,
      viewMessage: dbMsg.viewMessage
    };

    return makeSuccess({ body: responseBody });
  }
);
