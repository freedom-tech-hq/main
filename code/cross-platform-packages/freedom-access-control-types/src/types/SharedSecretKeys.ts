import { decryptingKeySetSchema, encryptingKeySetSchema, privateKeySetSchema } from 'freedom-crypto-data';
import { schema } from 'yaschema';

export const sharedSecretKeysSchema = schema.allOf3(privateKeySetSchema, encryptingKeySetSchema, decryptingKeySetSchema);
export type SharedSecretKeys = typeof sharedSecretKeysSchema.valueType;
