import { schema } from 'yaschema';

import { cryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema } from './crypto-key-sets/specific/internal/cryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema.ts';
import { privateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema } from './crypto-key-sets/specific/internal/privateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema.ts';

export const pureVerifyingKeySetSchema = schema.oneOf(
  cryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema,
  privateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema
);
export type PureVerifyingKeySet = typeof pureVerifyingKeySetSchema.valueType;
