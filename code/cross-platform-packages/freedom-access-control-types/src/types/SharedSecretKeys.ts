import { privateKeySetSchema, pureDecryptingKeySetSchema } from 'freedom-crypto-data';
import { schema } from 'yaschema';

export const sharedSecretKeysSchema = schema.allOf(privateKeySetSchema, pureDecryptingKeySetSchema);
export type SharedSecretKeys = typeof sharedSecretKeysSchema.valueType;
