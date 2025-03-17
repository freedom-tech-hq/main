import { makeStringSubtypeArray, schema } from 'yaschema';

export const hashingModes = makeStringSubtypeArray('SHA-256');
export const hashingModeSchema = schema.string(...hashingModes);
export type HashingMode = typeof hashingModeSchema.valueType;
