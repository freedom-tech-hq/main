import type { LocallyStoredCredentialId } from '../id/LocallyStoredCredentialId.ts';

export interface LocallyStoredEncryptedEmailCredentialInfo {
  locallyStoredCredentialId: LocallyStoredCredentialId;
  email: string;
  hasBiometricEncryption: boolean;
}
