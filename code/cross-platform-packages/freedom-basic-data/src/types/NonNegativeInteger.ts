import { schema } from 'yaschema';

export const nonNegativeIntegerSchema = schema.restrictedNumber([{ min: 0 }], { divisibleBy: [1] });
export type NonNegativeInteger = typeof nonNegativeIntegerSchema.valueType;
