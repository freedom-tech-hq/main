import { authHeadersSchema, isoDateTimeSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { apiInputMessageSchema } from '../../../types/ApiInputMessage.ts';
import { mailIdInfo } from '../../../types/MailId.ts';

export const POST = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/api/mail/message/draft',
  isSafeToRetry: false,
  schemas: {
    request: {
      headers: authHeadersSchema,
      body: apiInputMessageSchema
    },
    successResponse: {
      status: schema.number(StatusCodes.CREATED),
      body: schema.object({
        id: mailIdInfo.schema,
        updatedAt: isoDateTimeSchema,
        messageId: schema.string()
        // Note, if we add threadId here, we should also return the id(s) of other messages, that were just connected to the same thread
      })
    },
    failureResponse: makeFailureWithCodeSchemas()
  }
});
