import { authHeadersSchema, isoDateTimeSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { apiInputMessageSchema } from '../../../types/ApiInputMessage.ts';
import { mailIdInfo } from '../../../types/MailId.ts';
import { mailThreadIdInfo } from '../../../types/MailThreadId.ts';

export const PUT = makeHttpApi({
  method: 'PUT',
  routeType: 'rest',
  url: '/api/mail/message/{mailId}',
  isSafeToRetry: false,
  schemas: {
    request: {
      headers: authHeadersSchema,
      params: schema.object({
        mailId: mailIdInfo.schema
      }),
      body: apiInputMessageSchema
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: schema.object({
        updatedAt: isoDateTimeSchema,
        threadId: mailThreadIdInfo.schema
      })
    },
    failureResponse: makeFailureWithCodeSchemas('not-found')
  }
});
