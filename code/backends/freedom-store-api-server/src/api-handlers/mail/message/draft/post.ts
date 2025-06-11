import { makeFailure, makeSuccess } from 'freedom-async';
import { type IsoDateTime, makeIsoDateTime } from 'freedom-basic-data';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import { type DbMessageOut, dbQuery, identifyThread } from 'freedom-db';
import { mailThreadIdInfo, type MessageFolder } from 'freedom-email-api';
import { api, mailIdInfo } from 'freedom-email-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { StatusCodes } from 'http-status-codes';

import { getMessageIdFromMailId } from '../../../../internal/utils/getMessageIdFromMailId.ts';
import { getUserIdFromAuthorizationHeader } from '../../../../internal/utils/getUserIdFromAuthorizationHeader.ts';

export default makeHttpApiHandler([import.meta.filename], { api: api.message.draft.POST }, async (trace, { input: { headers, body } }) => {
  const currentUserId = getUserIdFromAuthorizationHeader(headers);
  if (currentUserId === undefined) {
    return makeFailure(new InputSchemaValidationError(trace, { message: 'User ID not found in auth context' }));
  }

  // Auto-fields
  const updatedAt = new Date();
  const mailId = mailIdInfo.make(`${makeIsoDateTime(updatedAt)}-${makeUuid()}`);
  const messageId = getMessageIdFromMailId(mailId);

  // Identify thread
  const threadResult = await identifyThread(trace, {
    inReplyTo: body.inReplyTo,
    references: [] // Not used for internally-created messages
  });
  if (!threadResult.ok) {
    return threadResult;
  }

  const threadId = threadResult.value ?? mailThreadIdInfo.make(makeUuid());

  // Folder is 'drafts' for user-created messages
  const folder: MessageFolder = 'drafts';

  // Construct the insert query
  const insertQuery = `
      INSERT INTO "messages" (
        "id", 
        "userId", 
        "updatedAt", 
        "folder", 
        "listFields", 
        "viewFields",
        "messageId",
        "threadId"
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING "id", "updatedAt"
    `;

  const params = [mailId, currentUserId, updatedAt, folder, body.listFields, body.viewFields, messageId, threadId];

  const result = await dbQuery<Pick<DbMessageOut, 'id' | 'updatedAt'>>(insertQuery, params);
  const dbMsg = result.rows[0];

  // Return the created message with server-generated fields
  return makeSuccess({
    status: StatusCodes.CREATED,
    body: {
      id: dbMsg.id,
      updatedAt: dbMsg.updatedAt.toISOString() as IsoDateTime,
      messageId,
      threadId
    }
  });
});
