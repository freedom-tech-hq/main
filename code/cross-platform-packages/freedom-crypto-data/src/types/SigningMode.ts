import { makeStringSubtypeArray, schema } from 'yaschema';

export const signingModes = makeStringSubtypeArray('RSASSA-PKCS1-v1_5/4096/SHA-256');
export const signingModeSchema = schema.string(...signingModes);
export type SigningMode = typeof signingModeSchema.valueType;
