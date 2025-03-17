import { schema } from 'yaschema';

import { cryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema } from './crypto-key-sets/specific/internal/cryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema.ts';
import { cryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema } from './crypto-key-sets/specific/internal/cryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema.ts';
import { privateCryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema } from './crypto-key-sets/specific/internal/privateCryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema.ts';
import { privateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema } from './crypto-key-sets/specific/internal/privateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema.ts';

export const pureCryptoKeySetSchema = schema.oneOf4(
  privateCryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema,
  privateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema,
  cryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema,
  cryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema
);
export type PureCryptoKeySet = typeof pureCryptoKeySetSchema.valueType;
