import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import { InternalStateError, UnauthorizedError } from 'freedom-common-errors';

/**
 * Authenticates using WebAuthn
 *
 * @returns a password derived from the localCredentialUuid and the private key protected by WebAuthn
 */
export const authenticateWithWebAuthn = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, localCredentialUuid: Uuid): PR<string, 'not-supported' | 'unauthorized'> => {
    try {
      // Check if WebAuthn is supported
      if (window.PublicKeyCredential === undefined) {
        return makeFailure(
          new InternalStateError(trace, { message: 'WebAuthn is not supported in this browser', errorCode: 'not-supported' })
        );
      }

      const challenge = Buffer.from(localCredentialUuid, 'utf-8');

      // Request authentication
      const publicKeyCredential = await navigator.credentials.get({
        publicKey: {
          challenge,
          userVerification: 'required',
          timeout: 60000
        }
      });

      if (publicKeyCredential === undefined || !(publicKeyCredential instanceof PublicKeyCredential)) {
        return makeFailure(new UnauthorizedError(trace, { message: 'Failed to create WebAuthn credential', errorCode: 'unauthorized' }));
      }

      // This should return a deterministic signature, which we're using as a password
      return makeSuccess(Buffer.from((publicKeyCredential.response as AuthenticatorAssertionResponse).signature).toString('hex'));
    } catch (e) {
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
