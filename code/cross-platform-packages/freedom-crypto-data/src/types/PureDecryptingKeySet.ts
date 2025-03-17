import { privateCryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema } from './crypto-key-sets/specific/internal/privateCryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema.ts';

export const pureDecryptingKeySetSchema = privateCryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema;
export type PureDecryptingKeySet = typeof pureDecryptingKeySetSchema.valueType;
