import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { draftPayloadSchema } from '../../types/mail/DraftPayload.ts';
import { viewMessageSchema } from '../../types/mail/ViewMessage.ts';

export const PUT = makeHttpApi({
  method: 'PUT',
  routeType: 'rest',
  url: '/api/mail/messages/:messageId',
  isSafeToRetry: false,
  schemas: {
    request: {
      headers: authHeadersSchema,
      params: schema.object({
        messageId: schema.string()
      }),
      body: draftPayloadSchema
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: viewMessageSchema
    },
    failureResponse: makeFailureWithCodeSchemas('not-found')
  }
});
