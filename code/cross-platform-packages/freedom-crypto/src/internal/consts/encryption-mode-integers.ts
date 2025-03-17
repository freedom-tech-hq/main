import { objectEntries } from 'freedom-cast';
import type { EncryptionMode } from 'freedom-crypto-data';

export const intValuesByEncryptionMode: Record<EncryptionMode, number> = {
  'RSA-OAEP/4096/SHA-256+AES/256/GCM': 0
};

export const encryptionModesByIntValue = objectEntries(intValuesByEncryptionMode).reduce(
  (out: Record<number, EncryptionMode>, [key, value]) => {
    out[value] = key;
    return out;
  },
  {}
);
