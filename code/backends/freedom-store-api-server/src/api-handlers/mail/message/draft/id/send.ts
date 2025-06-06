import { makeFailure, makeSuccess } from 'freedom-async';
import { makeIsoDateTime } from 'freedom-basic-data';
import { InputSchemaValidationError, NotFoundError } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import { type DbMessageOut, dbQuery } from 'freedom-db';
import { api, mailIdInfo, type MessageFolder } from 'freedom-email-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { StatusCodes } from 'http-status-codes';

import { getUserIdFromAuthorizationHeader } from '../../../../../internal/utils/getUserIdFromAuthorizationHeader.ts';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.message.draft.id.send.POST },
  async (
    trace,
    {
      input: {
        headers,
        params: { mailId },
        body: { agentMessage }
      }
    }
  ) => {
    const currentUserId = getUserIdFromAuthorizationHeader(headers);
    if (currentUserId === undefined) {
      return makeFailure(new InputSchemaValidationError(trace, { message: 'User ID not found in auth context' }));
    }

    // TODO: Add transaction here to ensure sent + outbox are always saved together
    const updatedAt = new Date();
    const folder: MessageFolder = 'sent';

    const updateQuery = `
        UPDATE "messages"
        SET "folder" = $1, "updatedAt" = $2
        WHERE "id" = $3 AND "userId" = $4
        RETURNING "id", "updatedAt"
      `;
    const paramsUpdate: unknown[] = [folder, updatedAt, mailId, currentUserId];
    const resultUpdate = await dbQuery<Pick<DbMessageOut, 'id' | 'updatedAt'>>(updateQuery, paramsUpdate);

    if (resultUpdate.rows.length === 0) {
      return makeFailure(
        new NotFoundError(trace, {
          message: `Draft message with id ${mailId} not found or not owned by user.`,
          errorCode: 'not-found'
        })
      );
    }

    // Create a copy of the message for outbound processing
    // This copy will be in the 'outbox' folder and will be processed by the email server
    const agentMessageId = mailIdInfo.make(`${makeIsoDateTime(updatedAt)}-${makeUuid()}`);
    const agentMessageListFields = agentMessage.listFields;
    const agentMessageViewFields = agentMessage.viewFields;
    const agentFolder: MessageFolder = 'outbox';

    const agentInsertQuery = `
      INSERT INTO "messages" (
        "id", "userId", "updatedAt", "folder", "listFields", "viewFields"
      ) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const agentParamsInsert: unknown[] = [
      agentMessageId,
      currentUserId, // Store the actual user ID, not the agent ID although the contents are encrypted for the agent
      updatedAt,
      agentFolder,
      agentMessageListFields,
      agentMessageViewFields
    ];
    await dbQuery(agentInsertQuery, agentParamsInsert);

    return makeSuccess({
      status: StatusCodes.OK,
      body: {}
    });
  }
);
