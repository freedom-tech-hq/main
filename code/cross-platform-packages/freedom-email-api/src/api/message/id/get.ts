import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { apiViewMessageSchema } from '../../../types/ApiViewMessage.ts';
import { mailIdInfo } from '../../../types/MailId.ts';

export const GET = makeHttpApi({
  method: 'GET',
  routeType: 'rest',
  url: '/api/mail/message/{mailId}',
  isSafeToRetry: true,
  schemas: {
    request: {
      headers: authHeadersSchema,
      params: schema.object({
        mailId: mailIdInfo.schema
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: apiViewMessageSchema
    },
    failureResponse: makeFailureWithCodeSchemas('not-found')
  }
});
