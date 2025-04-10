import { schema } from 'yaschema';

export const storedMailSchema = schema.object({
  from: schema.string(),
  to: schema.array({ items: schema.string() }),
  cc: schema.array({ items: schema.string() }).optional(),
  bcc: schema.array({ items: schema.string() }).optional(),
  subject: schema.string(),
  body: schema.string(),
  timeMSec: schema.number()
});
export type StoredMail = typeof storedMailSchema.valueType;
