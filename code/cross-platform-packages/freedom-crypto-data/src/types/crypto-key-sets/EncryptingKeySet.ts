import { schema } from 'yaschema';

import { pureEncryptingKeySetSchema } from '../PureEncryptingKeySet.ts';
import { combinationCryptoKeySetSchema } from './combinationCryptoKeySetSchema.ts';
import { privateCombinationCryptoKeySetSchema } from './privateCombinationCryptoKeySetSchema.ts';

export const encryptingKeySetSchema = schema.oneOf3(
  pureEncryptingKeySetSchema,
  combinationCryptoKeySetSchema,
  privateCombinationCryptoKeySetSchema
);
export type EncryptingKeySet = typeof encryptingKeySetSchema.valueType;
