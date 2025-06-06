import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { makePaginatedSchema, paginationOptionsSchema } from 'freedom-paginated-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { apiViewMessageSchema } from '../../../types/ApiViewMessage.ts';
import { mailThreadLikeIdSchema } from '../../../types/MailThreadLikeId.ts';

export const GET = makeHttpApi({
  method: 'GET',
  routeType: 'rest',
  url: '/api/mail/thread/{threadLikeId}',
  isSafeToRetry: true,
  schemas: {
    request: {
      headers: authHeadersSchema,
      params: schema.object({
        /** A thread here can represent a real thread or a single message */
        threadLikeId: mailThreadLikeIdSchema
      }),
      query: paginationOptionsSchema
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: makePaginatedSchema(apiViewMessageSchema)
    },
    failureResponse: makeFailureWithCodeSchemas('not-found')
  }
});
