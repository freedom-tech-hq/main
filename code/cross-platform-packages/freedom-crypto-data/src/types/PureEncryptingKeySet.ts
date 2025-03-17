import { schema } from 'yaschema';

import { cryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema } from './crypto-key-sets/specific/internal/cryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema.ts';
import { privateCryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema } from './crypto-key-sets/specific/internal/privateCryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema.ts';

export const pureEncryptingKeySetSchema = schema.oneOf(
  cryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema,
  privateCryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema
);
export type PureEncryptingKeySet = typeof pureEncryptingKeySetSchema.valueType;
