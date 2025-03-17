import type { SigningKeySet } from '../../types/crypto-key-sets/SigningKeySet.ts';
import type { VerifyingKeySet } from '../../types/crypto-key-sets/VerifyingKeySet.ts';

export const isSigningAndVerifyingKeySet = (value: any): value is SigningKeySet & VerifyingKeySet =>
  value !== null &&
  typeof value === 'object' &&
  'canSign' in value &&
  (value as { canSign: any }).canSign === true &&
  'canVerify' in value &&
  (value as { canVerify: any }).canVerify === true;
