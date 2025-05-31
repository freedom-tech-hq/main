import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { threadSchema } from '../../types/mail/Thread.ts';

export const GET = makeHttpApi({
  method: 'GET',
  routeType: 'rest',
  url: '/api/mail/threads/:id',
  isSafeToRetry: true,
  schemas: {
    request: {
      headers: authHeadersSchema,
      params: schema.object({
        id: schema.string()
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: threadSchema
    },
    failureResponse: makeFailureWithCodeSchemas()
  }
});
