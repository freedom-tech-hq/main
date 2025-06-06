import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { makePaginatedSchema, paginationOptionsSchema } from 'freedom-paginated-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { apiListMessageSchema } from '../../types/ApiListMessage.ts';
import { messageFolderSchema } from '../../types/MessageFolder.ts';

export const GET = makeHttpApi({
  method: 'GET',
  routeType: 'rest',
  url: '/api/mail/messages',
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
      body: makePaginatedSchema(apiListMessageSchema)
    },
    failureResponse: makeFailureWithCodeSchemas()
  }
});
