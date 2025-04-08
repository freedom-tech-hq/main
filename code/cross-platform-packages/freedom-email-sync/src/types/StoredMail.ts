import { schema } from 'yaschema';

export const storedMailSchema = schema.object({
  from: schema.string(),
  to: schema.string(),
  subject: schema.string(),
  body: schema.string(),
  timeMSec: schema.number()
});
export type StoredMail = typeof storedMailSchema.valueType;
