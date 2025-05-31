import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { draftPayloadSchema } from '../../types/mail/DraftPayload.ts';
import { viewMessageSchema } from '../../types/mail/ViewMessage.ts';

export const POST = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/api/mail/messages',
  isSafeToRetry: false,
  schemas: {
    request: {
      headers: authHeadersSchema,
      body: draftPayloadSchema
    },
    successResponse: {
      status: schema.number(StatusCodes.CREATED),
      body: viewMessageSchema
    },
    failureResponse: makeFailureWithCodeSchemas()
  }
});
