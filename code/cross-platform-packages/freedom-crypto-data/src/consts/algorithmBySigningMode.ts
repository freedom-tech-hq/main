import type { SigningMode } from '../types/SigningMode.ts';

export const algorithmBySigningMode: Record<SigningMode, 'Ed25519' | RsaHashedKeyGenParams | EcKeyGenParams> = {
  'RSASSA-PKCS1-v1_5/4096/SHA-256': {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 4096,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256'
  }
};
