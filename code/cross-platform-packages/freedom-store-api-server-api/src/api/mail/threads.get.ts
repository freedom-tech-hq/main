import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { apiThreadSchema } from 'freedom-email-sync';
import { makePaginatedSchema, paginationOptionsSchema } from 'freedom-paginated-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

export const GET = makeHttpApi({
  method: 'GET',
  routeType: 'rest',
  url: '/api/mail/threads',
  isSafeToRetry: true,
  schemas: {
    request: {
      headers: authHeadersSchema,
      query: paginationOptionsSchema
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: makePaginatedSchema(apiThreadSchema)
    },
    failureResponse: makeFailureWithCodeSchemas()
  }
});
