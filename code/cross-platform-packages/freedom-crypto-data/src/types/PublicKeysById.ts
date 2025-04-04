import { schema } from 'yaschema';

import { combinationCryptoKeySetSchema } from './crypto-key-sets/combinationCryptoKeySetSchema.ts';
import { cryptoKeySetIdInfo } from './CryptoKeySetId.ts';

export const publicKeysByIdSchema = schema.record(cryptoKeySetIdInfo.schema, combinationCryptoKeySetSchema);
export type PublicKeysById = typeof publicKeysByIdSchema.valueType;
