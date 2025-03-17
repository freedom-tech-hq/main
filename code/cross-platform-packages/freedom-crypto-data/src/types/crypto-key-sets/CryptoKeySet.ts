import { schema } from 'yaschema';

import { pureCryptoKeySetSchema } from '../PureCryptoKeySet.ts';
import { combinationCryptoKeySetSchema } from './combinationCryptoKeySetSchema.ts';
import { privateCombinationCryptoKeySetSchema } from './privateCombinationCryptoKeySetSchema.ts';

export const cryptoKeySetSchema = schema.oneOf3(
  pureCryptoKeySetSchema,
  combinationCryptoKeySetSchema,
  privateCombinationCryptoKeySetSchema
);
export type CryptoKeySet = typeof cryptoKeySetSchema.valueType;
