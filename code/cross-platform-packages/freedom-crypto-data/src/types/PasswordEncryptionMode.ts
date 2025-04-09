import { makeStringSubtypeArray, schema } from 'yaschema';

export const passwordEncryptionModes = makeStringSubtypeArray('PBKDF2/SHA-256*650000+AES/256/GCM');
export const passwordEncryptionModeSchema = schema.string(...passwordEncryptionModes);
export type PasswordEncryptionMode = typeof passwordEncryptionModeSchema.valueType;
