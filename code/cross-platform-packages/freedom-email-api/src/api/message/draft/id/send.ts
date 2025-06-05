import { authHeadersSchema, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

import { apiInputMessageSchema } from '../../../../types/ApiInputMessage.ts';
import { mailIdInfo } from '../../../../types/MailId.ts';

export const POST = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/api/mail/message/draft/{mailId}/send',
  isSafeToRetry: false,
  schemas: {
    request: {
      headers: authHeadersSchema,
      params: schema.object({
        mailId: mailIdInfo.schema
      }),
      body: schema.object({
        /** Should be encrypted with agent's public key */
        agentMessage: apiInputMessageSchema
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: schema.object({
        threadId: schema.string(),
        messageId: schema.string(),
        date: schema.string() // RFC 3339
      })
    },
    failureResponse: makeFailureWithCodeSchemas('not-found')
  }
});
