import { schema } from 'yaschema';

export const httpResponseStatusSchema = schema.restrictedNumber([{ min: 100, max: 599 }], { divisibleBy: [1] });
export type HttpResponseStatus = typeof httpResponseStatusSchema.valueType;
