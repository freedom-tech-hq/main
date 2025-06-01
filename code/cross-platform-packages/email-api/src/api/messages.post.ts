import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

export const POST = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/api/mail/messages',
  isSafeToRetry: false,
  schemas: {
    request: {
      headers: authHeadersSchema,
      body: schema.object({
        // TODO: Consider having PUT for both create and update,
        //  because we are moving to local-first where we allow the client to manage ids
        // Otherwise the fields are the same as in PUT
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.CREATED),
      body: schema.object({})
    },
    failureResponse: makeFailureWithCodeSchemas()
  }
});
