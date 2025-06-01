import { authHeadersSchema, base64String, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

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
      body: schema.object({
        // Open fields
        // see params // id: schema.string(),
        // from auth // userId,
        // auto // transferredAt,
        // constant // folder,

        // Encrypted fields
        listFields: base64String.schema,
        viewFields: base64String.schema

        // TODO: attachments
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: schema.object({})
    },
    failureResponse: makeFailureWithCodeSchemas('not-found')
  }
});
