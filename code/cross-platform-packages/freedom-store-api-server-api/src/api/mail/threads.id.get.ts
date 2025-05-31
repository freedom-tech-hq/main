import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { viewMessageSchema } from '../../types/mail/ViewMessage.ts';

// Note: maybe we don't need this. Not implementing, use GET /messages with threadId
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
      body: schema.object({
        messages: schema.array({ items: viewMessageSchema })
      })
    },
    failureResponse: makeFailureWithCodeSchemas()
  }
});
