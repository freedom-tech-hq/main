import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { apiViewMessageSchema } from 'freedom-email-sync';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

export const GET = makeHttpApi({
  method: 'GET',
  routeType: 'rest',
  url: '/api/mail/messages/:messageId',
  isSafeToRetry: true,
  schemas: {
    request: {
      headers: authHeadersSchema,
      params: schema.object({
        messageId: schema.string()
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: apiViewMessageSchema
    },
    failureResponse: makeFailureWithCodeSchemas('not-found')
  }
});
