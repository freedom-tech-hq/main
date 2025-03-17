import { schema } from 'yaschema';

import { cryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema } from './crypto-key-sets/specific/internal/cryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema.ts';
import { cryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema } from './crypto-key-sets/specific/internal/cryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema.ts';

export const purePublicKeySetSchema = schema.oneOf(
  cryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema,
  cryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema
);
export type PurePublicKeySet = typeof purePublicKeySetSchema.valueType;
