import { schema } from 'yaschema';

import { purePrivateKeySetSchema } from '../PurePrivateKeySet.ts';
import { privateCombinationCryptoKeySetSchema } from './privateCombinationCryptoKeySetSchema.ts';

export const privateKeySetSchema = schema.oneOf(purePrivateKeySetSchema, privateCombinationCryptoKeySetSchema);
export type PrivateKeySet = typeof privateKeySetSchema.valueType;
