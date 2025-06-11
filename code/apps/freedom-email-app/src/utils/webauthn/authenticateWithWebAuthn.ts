import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { base64String } from 'freedom-basic-data';
import { InternalStateError, UnauthorizedError } from 'freedom-common-errors';
import type { LocallyStoredEncryptedEmailCredentialInfo } from 'freedom-email-tasks-web-worker';

/**
 * Authenticates using WebAuthn
 *
 * @returns a password derived from the localCredentialUuid and the private key protected by WebAuthn
 */
export const authenticateWithWebAuthn = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, credential: LocallyStoredEncryptedEmailCredentialInfo): PR<{ webAuthnPassword: string }, 'unauthorized'> => {
    try {
      // Check if WebAuthn is supported
      if (window.PublicKeyCredential === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'WebAuthn is not supported in this browser' }));
      } else if (credential.webAuthnCredentialId === undefined) {
        return makeFailure(new UnauthorizedError(trace, { message: 'WebAuthn setup incomplete', errorCode: 'unauthorized' }));
      }

      const challenge = Buffer.from(credential.locallyStoredCredentialId, 'utf-8');

      // Request authentication
      const publicKeyCredential = await navigator.credentials.get({
        publicKey: {
          allowCredentials: [{ id: base64String.toBuffer(credential.webAuthnCredentialId), type: 'public-key' }],
          challenge,
          userVerification: 'required',
          timeout: 60000
        }
      });

      if (publicKeyCredential === undefined || !(publicKeyCredential instanceof PublicKeyCredential)) {
        return makeFailure(new UnauthorizedError(trace, { message: 'Failed to create WebAuthn credential', errorCode: 'unauthorized' }));
      }

      // This should return a deterministic signature, which we're using as a password
      return makeSuccess({
        webAuthnPassword: Buffer.from((publicKeyCredential.response as AuthenticatorAssertionResponse).signature).toString('hex')
      });
    } catch (e) {
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
