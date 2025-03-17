import type { VerifyingKeySet } from '../../types/crypto-key-sets/VerifyingKeySet.ts';

export const isVerifyingKeySet = (value: any): value is VerifyingKeySet =>
  value !== null && typeof value === 'object' && 'canVerify' in value && (value as { canVerify: any }).canVerify === true;
