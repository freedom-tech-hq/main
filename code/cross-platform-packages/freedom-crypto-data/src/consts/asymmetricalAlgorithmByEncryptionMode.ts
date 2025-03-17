import type { AsymmetricalSingleStageEncryptionMode } from '../types/EncryptionMode.ts';

export const asymmetricalAlgorithmByEncryptionMode = {
  'RSA-OAEP/4096/SHA-256': { name: 'RSA-OAEP', modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }
} satisfies Record<AsymmetricalSingleStageEncryptionMode, 'Ed25519' | RsaHashedKeyGenParams | EcKeyGenParams>;
