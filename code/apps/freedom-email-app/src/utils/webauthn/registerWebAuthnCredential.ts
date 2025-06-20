import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { base64String } from 'freedom-basic-data';
import { InternalStateError, UnauthorizedError } from 'freedom-common-errors';
import type { LocallyStoredEncryptedEmailCredentialInfo } from 'freedom-email-tasks-web-worker';

/**
 * Registers a new WebAuthn credential for the given credential UUID.  This should be called after successful password authentication.
 *
 * @returns a password derived from the localCredentialUuid and the private key protected by WebAuthn
 */
export const registerWebAuthnCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, credential: LocallyStoredEncryptedEmailCredentialInfo): PR<{ webAuthnCredentialId: Base64String }, 'unauthorized'> => {
    try {
      // Check if WebAuthn is supported
      if (window.PublicKeyCredential === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'WebAuthn is not supported in this browser' }));
      }

      const challenge = Buffer.from(credential.locallyStoredCredentialId, 'utf-8');

      // Create the credential
      const publicKeyCredential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            // Must match the origin's domain
            name: window.location.hostname,
            id: window.location.hostname
          },
          user: {
            id: Buffer.from(credential.locallyStoredCredentialId, 'utf-8'),
            name: credential.email,
            displayName: 'Freedom Email Account'
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 } // RS256
          ],
          timeout: 60000,
          attestation: 'none',
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'required',
            requireResidentKey: true
          }
        }
      });

      if (publicKeyCredential === undefined || !(publicKeyCredential instanceof PublicKeyCredential)) {
        return makeFailure(new UnauthorizedError(trace, { message: 'Failed to create WebAuthn credential', errorCode: 'unauthorized' }));
      }

      return makeSuccess({ webAuthnCredentialId: base64String.makeWithBuffer(publicKeyCredential.rawId) });
    } catch (e) {
      return makeFailure(new GeneralError(trace, e));
    }
  }
);
