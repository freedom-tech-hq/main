import { publicKeySetSchema, pureEncryptingKeySetSchema } from 'freedom-crypto-data';
import { schema } from 'yaschema';

export const sharedPublicKeysSchema = schema.allOf(publicKeySetSchema, pureEncryptingKeySetSchema);
export type SharedPublicKeys = typeof sharedPublicKeysSchema.valueType;
