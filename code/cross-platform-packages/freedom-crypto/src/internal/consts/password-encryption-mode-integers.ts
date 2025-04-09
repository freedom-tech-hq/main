import { objectEntries } from 'freedom-cast';
import type { PasswordEncryptionMode } from 'freedom-crypto-data';

export const intValuesByPasswordEncryptionMode: Record<PasswordEncryptionMode, number> = {
  'PBKDF2/SHA-256*650000+AES/256/GCM': 0
};

export const passwordEncryptionModesByIntValue = objectEntries(intValuesByPasswordEncryptionMode).reduce(
  (out: Record<number, PasswordEncryptionMode>, [key, value]) => {
    out[value] = key;
    return out;
  },
  {}
);
