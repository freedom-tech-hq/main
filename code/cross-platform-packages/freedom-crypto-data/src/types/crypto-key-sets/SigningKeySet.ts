import { schema } from 'yaschema';

import { pureSigningKeySetSchema } from '../PureSigningKeySet.ts';
import { privateCombinationCryptoKeySetSchema } from './privateCombinationCryptoKeySetSchema.ts';

export const signingKeySetSchema = schema.oneOf(pureSigningKeySetSchema, privateCombinationCryptoKeySetSchema);
export type SigningKeySet = typeof signingKeySetSchema.valueType;
