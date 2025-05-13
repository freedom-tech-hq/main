import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { type Base64String, base64String } from 'freedom-basic-data';
import { generateSignatureForBuffer } from 'freedom-crypto';
import type { SigningKeySet } from 'freedom-crypto-data';
import type { EmailUserId } from 'freedom-email-sync';
import { makeApiFetchTask } from 'freedom-fetching';
import { api } from 'freedom-store-api-server-api';
import { getDefaultApiRoutingContext } from 'yaschema-api';

// Create API fetch task for storing credentials
const storeCredentialsOnRemote = makeApiFetchTask([import.meta.filename, 'storeCredentialsOnRemote'], api.storeCredentials.POST);

/**
 * Stores encrypted user credentials on the server with a signature for verification
 *
 * @param userId - The email user ID
 * @param encryptedCredentials - The encrypted credentials to store
 * @param signingKey - Key used to sign the credentials for verification
 */
export const storeCredentialsOnServer = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { userId, encryptedCredentials, signingKeys }: { userId: EmailUserId; encryptedCredentials: Base64String; signingKeys: SigningKeySet }
  ): PR<void, 'not-found' | 'invalid-signature'> => {
    // Generate signature for the encrypted credentials
    const signatureResult = await generateSignatureForBuffer(trace, {
      value: base64String.toBuffer(encryptedCredentials),
      signingKeys
    });

    if (!signatureResult.ok) {
      return signatureResult;
    }

    // Call the store credentials API
    const response = await storeCredentialsOnRemote(trace, {
      body: {
        userId,
        encryptedCredentials,
        signature: base64String.makeWithBuffer(signatureResult.value)
      },
      context: getDefaultApiRoutingContext()
    });

    if (!response.ok) {
      return response;
    }

    return makeSuccess(undefined);
  }
);
