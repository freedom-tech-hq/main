import { makeStringSubtypeArray } from 'yaschema';

export const cryptoKeySetKinds = makeStringSubtypeArray(
  'private:RSA-OAEP/4096/SHA-256+AES/256/GCM',
  'RSA-OAEP/4096/SHA-256+AES/256/GCM',
  'private:RSASSA-PKCS1-v1_5/4096/SHA-256',
  'RSASSA-PKCS1-v1_5/4096/SHA-256'
);
export type CryptoKeySetKind = (typeof cryptoKeySetKinds)[0];
