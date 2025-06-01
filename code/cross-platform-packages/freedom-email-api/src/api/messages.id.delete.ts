import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

export const DELETE = makeHttpApi({
  method: 'DELETE',
  routeType: 'rest',
  url: '/api/mail/messages/{messageId}',
  isSafeToRetry: false,
  schemas: {
    request: {
      headers: authHeadersSchema,
      params: schema.object({
        messageId: schema.string()
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: schema.object({
        deleted: schema.boolean()
      })
    },
    failureResponse: makeFailureWithCodeSchemas('not-found')
  }
});
