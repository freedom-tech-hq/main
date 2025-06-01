import { authHeadersSchema, base64String, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

export const POST = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/api/mail/messages/:messageId/send',
  isSafeToRetry: false,
  schemas: {
    request: {
      headers: authHeadersSchema,
      params: schema.object({
        messageId: schema.string()
      }),
      body: schema.object({
        // Same as in PUT
        listMessage: base64String.schema,
        viewMessage: base64String.schema,
        raw: base64String.schema,

        // TODO: attachments

        // Encrypted with Mail Agent's public key
        // TODO: solve doubled message size
        agentRawMessage: base64String.schema
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
