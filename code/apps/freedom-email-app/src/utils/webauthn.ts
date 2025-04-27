import { log } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import { base64String } from 'freedom-basic-data';

// Constants for credential storage
const CREDENTIAL_NAME_PREFIX = 'freedom-email-app-credential';

/**
 * Registers a new WebAuthn credential for the given credential UUID
 * This should be called after successful password authentication
 */
export const registerWebAuthnCredential = async (
  credentialUuid: Uuid
): Promise<boolean> => {
  try {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      log().warn?.('WebAuthn is not supported in this browser');
      return false;
    }

    // Generate a random challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

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
          id: new TextEncoder().encode(credentialUuid),
          name: `${CREDENTIAL_NAME_PREFIX}-${credentialUuid}`,
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

    if (!publicKeyCredential) {
      log().error?.('Failed to create WebAuthn credential');
      return false;
    }

    log().info?.('WebAuthn credential registered successfully');
    return true;
  } catch (error) {
    log().error?.('Error registering WebAuthn credential', error);
    return false;
  }
};

/**
 * Authenticates using WebAuthn for the given credential UUID
 * Returns the credential ID if authentication is successful
 */
export const authenticateWithWebAuthn = async (
  credentialUuid: Uuid
): Promise<string | null> => {
  try {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      log().warn?.('WebAuthn is not supported in this browser');
      return null;
    }

    // Generate a random challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Request authentication
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: 'required',
        timeout: 60000
      }
    });

    if (!credential || !('id' in credential)) {
      log().error?.('WebAuthn authentication failed');
      return null;
    }

    // Return the credential ID
    return credential.id;
  } catch (error) {
    log().error?.('Error authenticating with WebAuthn', error);
    return null;
  }
};

/**
 * Checks if WebAuthn credentials are available for the user
 */
export const isWebAuthnAvailable = async (): Promise<boolean> => {
  if (!window.PublicKeyCredential) {
    return false;
  }
  
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};