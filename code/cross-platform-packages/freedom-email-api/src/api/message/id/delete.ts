import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { mailIdInfo } from '../../../types/MailId.ts';

export const DELETE = makeHttpApi({
  method: 'DELETE',
  routeType: 'rest',
  url: '/api/mail/message/{mailId}',
  isSafeToRetry: false,
  schemas: {
    request: {
      headers: authHeadersSchema,
      params: schema.object({
        mailId: mailIdInfo.schema
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: schema.object({
        deleted: schema.boolean()
      })
    },
    failureResponse: makeFailureWithCodeSchemas('not-found')
  }
});
