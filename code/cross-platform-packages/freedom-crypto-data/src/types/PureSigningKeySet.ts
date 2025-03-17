import { privateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema } from './crypto-key-sets/specific/internal/privateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema.ts';

export const pureSigningKeySetSchema = privateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema;
export type PureSigningKeySet = typeof pureSigningKeySetSchema.valueType;
