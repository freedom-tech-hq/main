import { base64String, makeFailureWithCodeSchemas } from 'freedom-basic-data';
import { emailUserIdInfo, encryptedEmailCredentialSchema } from 'freedom-email-api';
import { StatusCodes } from 'http-status-codes';
import { schema } from 'yaschema';
import { makeHttpApi } from 'yaschema-api';

export const POST = makeHttpApi({
  method: 'POST',
  routeType: 'rest',
  url: '/api/credentials/store',
  isSafeToRetry: true, // Is idempotent
  schemas: {
    request: {
      body: schema.object({
        userId: emailUserIdInfo.schema,
        encryptedCredential: encryptedEmailCredentialSchema,
        signature: base64String.schema // Used to verify request authenticity
      })
    },
    successResponse: {
      status: schema.number(StatusCodes.OK)
    },
    failureResponse: makeFailureWithCodeSchemas(
      'not-found', // User not found
      'invalid-signature' // Signature verification failed
    )
  }
});
