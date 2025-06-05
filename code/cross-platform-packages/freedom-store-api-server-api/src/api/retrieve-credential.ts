import { makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { emailUserIdInfo, encryptedEmailCredentialSchema } from 'freedom-email-api';
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
        encryptedCredential: encryptedEmailCredentialSchema
      })
    },
    failureResponse: makeFailureWithCodeSchemas(
      'not-found' // Email is not found
    )
  }
});
