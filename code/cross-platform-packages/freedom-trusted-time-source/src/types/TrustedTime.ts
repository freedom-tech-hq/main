import { base64String, timeIdInfo } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const trustedTimeSchema = schema.object({
  timeId: timeIdInfo.schema,
  trustedTimeSignature: base64String.schema
});
export type TrustedTime = typeof trustedTimeSchema.valueType;
