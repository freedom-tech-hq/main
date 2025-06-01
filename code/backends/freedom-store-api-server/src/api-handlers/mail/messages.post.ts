import { makeFailure, makeSuccess } from 'freedom-async';
import { type IsoDateTime, makeIsoDateTime } from 'freedom-basic-data';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import { type DbMessageOut, dbQuery } from 'freedom-db';
import { api, types } from 'freedom-email-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { StatusCodes } from 'http-status-codes';

import { getUserIdFromAuthorizationHeader } from '../../internal/utils/getUserIdFromAuthorizationHeader.ts';

export default makeHttpApiHandler([import.meta.filename], { api: api.messagesPost.POST }, async (trace, { input: { headers, body } }) => {
  const currentUserId = getUserIdFromAuthorizationHeader(headers);
  if (currentUserId === undefined) {
    return makeFailure(new InputSchemaValidationError(trace, { message: 'User ID not found in auth context' }));
  }

  // Auto-fields
  const updatedAt = new Date();
  const messageId = types.mailIdInfo.make(`${makeIsoDateTime(updatedAt)}-${makeUuid()}`);

  // Folder is 'drafts' for user-created messages
  const folder: types.MessageFolder = 'drafts';

  // Construct the insert query
  const insertQuery = `
      INSERT INTO "messages" (
        "id", 
        "userId", 
        "updatedAt", 
        "folder", 
        "listFields", 
        "viewFields"
      ) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING "id", "updatedAt"
    `;

  const params = [messageId, currentUserId, updatedAt, folder, body.listFields, body.viewFields];

  const result = await dbQuery<Pick<DbMessageOut, 'id' | 'updatedAt'>>(insertQuery, params);
  const dbMsg = result.rows[0];

  // Return the created message with server-generated fields
  return makeSuccess({
    status: StatusCodes.CREATED,
    body: {
      id: dbMsg.id,
      updatedAt: dbMsg.updatedAt.toISOString() as IsoDateTime
    }
  });
});
