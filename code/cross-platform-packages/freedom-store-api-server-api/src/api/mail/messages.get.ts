import { makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { makePaginatedSchema, paginationOptionsSchema } from 'freedom-paginated-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { listMessageSchema } from '../../types/mail/ListMessage.ts';

export const GET = makeHttpApi({
  method: 'GET',
  routeType: 'rest',
  url: '/api/mail/messages',
  isSafeToRetry: true,
  schemas: {
    request: {
      query: paginationOptionsSchema
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: makePaginatedSchema(listMessageSchema)
    },
    failureResponse: makeFailureWithCodeSchemas()
  }
});
