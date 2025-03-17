import { objectEntries } from 'freedom-cast';
import type { SigningMode } from 'freedom-crypto-data';

export const intValuesBySigningMode: Record<SigningMode, number> = {
  'RSASSA-PKCS1-v1_5/4096/SHA-256': 0
};

export const signingModesByIntValue = objectEntries(intValuesBySigningMode).reduce((out: Record<number, SigningMode>, [key, value]) => {
  out[value] = key;
  return out;
}, {});
