import type { Uuid } from 'freedom-contexts';

export interface LocallyStoredEncryptedEmailCredentialInfo {
  localUuid: Uuid;
  description: string;
  hasBiometricEncryption: boolean;
}
