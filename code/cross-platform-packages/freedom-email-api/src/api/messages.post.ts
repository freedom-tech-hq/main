import { authHeadersSchema, isoDateTimeSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { mailIdInfo } from 'freedom-email-sync';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { apiInputMessageSchema } from '../types/ApiInputMessage.ts';

export const POST = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/api/mail/messages',
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
        updatedAt: isoDateTimeSchema
      })
    },
    failureResponse: makeFailureWithCodeSchemas()
  }
});
