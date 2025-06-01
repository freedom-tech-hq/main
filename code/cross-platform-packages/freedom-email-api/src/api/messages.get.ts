import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { makePaginatedSchema, paginationOptionsSchema } from 'freedom-paginated-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { apiListMessageSchema } from '../types/ApiListMessage.ts';

export const GET = makeHttpApi({
  method: 'GET',
  routeType: 'rest',
  url: '/api/mail/messages',
  isSafeToRetry: true,
  schemas: {
    request: {
      headers: authHeadersSchema,
      query: schema.allOf(
        paginationOptionsSchema,
        schema.object({
          threadId: schema.string().optional()
        })
      )
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: makePaginatedSchema(apiListMessageSchema)
    },
    failureResponse: makeFailureWithCodeSchemas()
  }
});
