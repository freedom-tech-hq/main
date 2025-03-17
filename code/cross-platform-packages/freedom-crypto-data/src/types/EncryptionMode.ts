import { makeStringSubtypeArray, schema } from 'yaschema';

export const asymmetricalSingleStageEncryptionModes = makeStringSubtypeArray('RSA-OAEP/4096/SHA-256');
export const asymmetricalSingleStageEncryptionModeSchema = schema.string(...asymmetricalSingleStageEncryptionModes);
export type AsymmetricalSingleStageEncryptionMode = typeof asymmetricalSingleStageEncryptionModeSchema.valueType;

export const symmetricalSingleStageEncryptionModes = makeStringSubtypeArray('AES/256/GCM');
export const symmetricalSingleStageEncryptionModeSchema = schema.string(...symmetricalSingleStageEncryptionModes);
export type SymmetricalSingleStageEncryptionMode = typeof symmetricalSingleStageEncryptionModeSchema.valueType;

export const singleStageEncryptionModes = makeStringSubtypeArray(
  ...asymmetricalSingleStageEncryptionModes,
  ...symmetricalSingleStageEncryptionModes
);
export const singleStageEncryptionModeSchema = schema.string(...singleStageEncryptionModes);
export type SingleStageEncryptionMode = typeof singleStageEncryptionModeSchema.valueType;

export const encryptionModes = makeStringSubtypeArray('RSA-OAEP/4096/SHA-256+AES/256/GCM');
export const encryptionModeSchema = schema.string(...encryptionModes);
export type EncryptionMode = typeof encryptionModeSchema.valueType;
