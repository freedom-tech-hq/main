import { makeFailure, makeSuccess } from 'freedom-async';
import type { IsoDateTime } from 'freedom-basic-data';
import { InputSchemaValidationError, NotFoundError } from 'freedom-common-errors';
import { type DbMessageOut, dbQuery } from 'freedom-db';
import { api, type types } from 'freedom-email-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';

import { getUserIdFromAuthorizationHeader } from '../../internal/utils/getUserIdFromAuthorizationHeader.ts';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.messagesIdGet.GET },
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
      SELECT "id", "userId", "updatedAt", "listFields", "viewFields"
      FROM "messages"
      WHERE "id" = $1 AND "userId" = $2
    `;

    const result = await dbQuery<Pick<DbMessageOut, 'id' | 'userId' | 'updatedAt' | 'listFields' | 'viewFields'>>(sql, [
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
      updatedAt: dbMsg.updatedAt.toISOString() as IsoDateTime,
      listFields: dbMsg.listFields,
      viewFields: dbMsg.viewFields
    };

    return makeSuccess({ body: responseBody });
  }
);
