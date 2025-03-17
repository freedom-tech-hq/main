import type { SymmetricalSingleStageEncryptionMode } from '../types/EncryptionMode.ts';

export const symmetricalAlgorithmByEncryptionMode = {
  'AES/256/GCM': { name: 'AES-GCM', length: 256 }
} satisfies Record<SymmetricalSingleStageEncryptionMode, AesKeyGenParams | HmacKeyGenParams | Pbkdf2Params>;
