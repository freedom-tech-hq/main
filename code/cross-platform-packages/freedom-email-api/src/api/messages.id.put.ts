import { authHeadersSchema, isoDateTimeSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { apiInputMessageSchema } from '../types/ApiInputMessage.ts';

export const PUT = makeHttpApi({
  method: 'PUT',
  routeType: 'rest',
  url: '/api/mail/messages/{messageId}',
  isSafeToRetry: false,
  schemas: {
    request: {
      headers: authHeadersSchema,
      params: schema.object({
        messageId: schema.string()
      }),
      body: apiInputMessageSchema
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: schema.object({
        updatedAt: isoDateTimeSchema
      })
    },
    failureResponse: makeFailureWithCodeSchemas('not-found')
  }
});
