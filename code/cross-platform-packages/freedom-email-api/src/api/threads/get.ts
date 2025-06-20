import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { makePaginatedSchema, paginationOptionsSchema } from 'freedom-paginated-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { apiThreadSchema } from '../../types/ApiThread.ts';
import { messageFolderSchema } from '../../types/MessageFolder.ts';

export const GET = makeHttpApi({
  method: 'GET',
  routeType: 'rest',
  url: '/api/mail/threads',
  isSafeToRetry: true,
  schemas: {
    request: {
      headers: authHeadersSchema,
      query: schema.extendsObject(
        paginationOptionsSchema,
        schema.object({
          folder: messageFolderSchema
        })
      )
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: makePaginatedSchema(apiThreadSchema)
    },
    failureResponse: makeFailureWithCodeSchemas()
  }
});
