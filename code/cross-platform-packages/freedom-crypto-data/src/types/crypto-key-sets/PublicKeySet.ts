import { schema } from 'yaschema';

import { purePublicKeySetSchema } from '../PurePublicKeySet.ts';
import { combinationCryptoKeySetSchema } from './combinationCryptoKeySetSchema.ts';

export const publicKeySetSchema = schema.oneOf(purePublicKeySetSchema, combinationCryptoKeySetSchema);
export type PublicKeySet = typeof publicKeySetSchema.valueType;
