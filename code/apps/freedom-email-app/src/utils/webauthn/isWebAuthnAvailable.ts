import { once } from 'lodash-es';

/** Checks if WebAuthn is available */
export const isWebAuthnAvailable = once(async (): Promise<boolean> => {
  if (window.PublicKeyCredential === undefined) {
    return false;
  }

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
});
