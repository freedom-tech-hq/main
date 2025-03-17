import { schema } from 'yaschema';

import { pureVerifyingKeySetSchema } from '../PureVerifyingKeySet.ts';
import { combinationCryptoKeySetSchema } from './combinationCryptoKeySetSchema.ts';
import { privateCombinationCryptoKeySetSchema } from './privateCombinationCryptoKeySetSchema.ts';

export const verifyingKeySetSchema = schema.oneOf3(
  pureVerifyingKeySetSchema,
  combinationCryptoKeySetSchema,
  privateCombinationCryptoKeySetSchema
);
export type VerifyingKeySet = typeof verifyingKeySetSchema.valueType;
