import type { SigningKeySet } from '../../types/crypto-key-sets/SigningKeySet.ts';

export const isSigningKeySet = (value: any): value is SigningKeySet =>
  value !== null && typeof value === 'object' && 'canSign' in value && (value as { canSign: any }).canSign === true;
