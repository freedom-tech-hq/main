import { makeFailure, makeSuccess } from 'freedom-async';
import { base64String } from 'freedom-basic-data';
import { UnauthorizedError } from 'freedom-common-errors';
import { isSignatureValidForBuffer } from 'freedom-crypto';
import { getUserById, saveUserCredentials } from 'freedom-db';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { api } from 'freedom-store-api-server-api';

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.storeCredentials.POST },
  async (
    trace,
    {
      input: {
        body: { userId, encryptedCredentials, signature }
      }
    }
  ) => {
    // Get user from database
    const userResult = await getUserById(trace, userId);
    if (!userResult.ok) {
      return userResult;
    }
    const user = userResult.value;

    // Verify signature to ensure the request is authentic
    // The signature should be created using the user's private key
    const verificationResult = await isSignatureValidForBuffer(trace, {
      value: base64String.toBuffer(encryptedCredentials),
      signature: base64String.toBuffer(signature),
      verifyingKeys: user.publicKeys
    });
    if (!verificationResult.ok) {
      return makeFailure(
        new UnauthorizedError(trace, {
          errorCode: 'invalid-signature',
          message: 'Signature verification failed'
        })
      );
    }

    // Save user's encrypted credentials
    const saveResult = await saveUserCredentials(trace, userId, encryptedCredentials);
    if (!saveResult.ok) {
      return saveResult;
    }

    return makeSuccess({});
  }
);
