import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { makePaginatedSchema, paginationOptionsSchema } from 'freedom-paginated-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { apiViewMessageSchema } from '../types/ApiViewMessage.ts';

export const GET = makeHttpApi({
  method: 'GET',
  routeType: 'rest',
  url: '/api/mail/threads/{threadId}',
  isSafeToRetry: true,
  schemas: {
    request: {
      headers: authHeadersSchema,
      params: schema.object({
        threadId: schema.string()
      }),
      query: paginationOptionsSchema
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: makePaginatedSchema(apiViewMessageSchema)
    },
    failureResponse: makeFailureWithCodeSchemas()
  }
});
