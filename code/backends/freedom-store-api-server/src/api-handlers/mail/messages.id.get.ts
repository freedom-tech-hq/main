import { makeFailure, makeSuccess } from 'freedom-async';
import type { IsoDateTime } from 'freedom-basic-data';
import { InputSchemaValidationError, NotFoundError } from 'freedom-common-errors';
import { type DbMessage, dbQuery } from 'freedom-db';
import { api, type types } from 'freedom-email-api';
import { type EmailUserId, emailUserIdInfo } from 'freedom-email-sync';
import { makeHttpApiHandler } from 'freedom-server-api-handling';

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
  { api: api.messagesId.GET },
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
      SELECT "id", "userId", "transferredAt", "listFields", "viewFields"
      FROM "messages"
      WHERE "id" = $1 AND "userId" = $2
    `;

    const result = await dbQuery<Pick<DbMessage, 'id' | 'userId' | 'transferredAt' | 'listFields' | 'viewFields'>>(sql, [
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

    const responseBody: types.ApiViewMessage = {
      id: dbMsg.id,
      transferredAt: dbMsg.transferredAt.toISOString() as IsoDateTime,
      listFields: dbMsg.listFields,
      viewFields: dbMsg.viewFields
    };

    return makeSuccess({ body: responseBody });
  }
);
