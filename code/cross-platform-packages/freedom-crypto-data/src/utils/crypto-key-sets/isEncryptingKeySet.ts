import type { EncryptingKeySet } from '../../types/crypto-key-sets/EncryptingKeySet.ts';

export const isEncryptingKeySet = (value: any): value is EncryptingKeySet =>
  value !== null && typeof value === 'object' && 'canEncrypt' in value && (value as { canEncrypt: any }).canEncrypt === true;
