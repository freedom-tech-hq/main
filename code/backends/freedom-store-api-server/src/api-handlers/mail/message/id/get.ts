import { makeFailure, makeSuccess } from 'freedom-async';
import { InputSchemaValidationError } from 'freedom-common-errors';
import { api } from 'freedom-email-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';

import { getMessageById } from '../../../../internal/utils/getMessageById.ts';
import { getUserIdFromAuthorizationHeader } from '../../../../internal/utils/getUserIdFromAuthorizationHeader.ts';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.message.id.GET },
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
      return makeFailure(new InputSchemaValidationError(trace, { message: 'User ID not found in auth context' }));
    }

    const message = await getMessageById(trace, { mailId, userId: currentUserId });
    if (!message.ok) {
      return message;
    }

    return makeSuccess({ body: message.value });
  }
);
