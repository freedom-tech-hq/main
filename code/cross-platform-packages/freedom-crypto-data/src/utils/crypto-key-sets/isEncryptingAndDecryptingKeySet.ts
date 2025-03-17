import type { DecryptingKeySet } from '../../types/crypto-key-sets/DecryptingKeySet.ts';
import type { EncryptingKeySet } from '../../types/crypto-key-sets/EncryptingKeySet.ts';

export const isEncryptingAndDecryptingKeySet = (value: any): value is EncryptingKeySet & DecryptingKeySet =>
  value !== null &&
  typeof value === 'object' &&
  'canEncrypt' in value &&
  (value as { canEncrypt: any }).canEncrypt === true &&
  'canDecrypt' in value &&
  (value as { canDecrypt: any }).canDecrypt === true;
