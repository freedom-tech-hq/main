import { base64String, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { emailUserIdInfo } from 'freedom-email-sync';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

export const POST = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/api/credentials/retrieve',
  isSafeToRetry: true,
  schemas: {
    request: {
      body: schema.object({
        email: schema.string()
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.OK),
      body: schema.object({
        userId: emailUserIdInfo.schema,
        encryptedCredentials: base64String.schema.allowNull()
      })
    },
    failureResponse: makeFailureWithCodeSchemas(
      'not-found' // Email is not found
    )
  }
});
