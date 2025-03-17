import { schema } from 'yaschema';

import { pureDecryptingKeySetSchema } from '../PureDecryptingKeySet.ts';
import { privateCombinationCryptoKeySetSchema } from './privateCombinationCryptoKeySetSchema.ts';

export const decryptingKeySetSchema = schema.oneOf(pureDecryptingKeySetSchema, privateCombinationCryptoKeySetSchema);
export type DecryptingKeySet = typeof decryptingKeySetSchema.valueType;
