import type { DecryptingKeySet } from '../../types/crypto-key-sets/DecryptingKeySet.ts';

export const isDecryptingKeySet = (value: any): value is DecryptingKeySet =>
  value !== null && typeof value === 'object' && 'canDecrypt' in value && (value as { canDecrypt: any }).canDecrypt === true;
