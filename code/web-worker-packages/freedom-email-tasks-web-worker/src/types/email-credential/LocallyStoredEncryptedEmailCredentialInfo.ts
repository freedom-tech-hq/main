import type { Base64String } from 'freedom-basic-data';

import type { LocallyStoredCredentialId } from '../id/LocallyStoredCredentialId.ts';

export interface LocallyStoredEncryptedEmailCredentialInfo {
  locallyStoredCredentialId: LocallyStoredCredentialId;
  email: string;
  webAuthnCredentialId: Base64String | undefined;
}
