import { schema } from 'yaschema';

import { privateCryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema } from './crypto-key-sets/specific/internal/privateCryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema.ts';
import { privateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema } from './crypto-key-sets/specific/internal/privateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema.ts';

export const purePrivateKeySetSchema = schema.oneOf(
  privateCryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema,
  privateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema
);
export type PurePrivateKeySet = typeof purePrivateKeySetSchema.valueType;
