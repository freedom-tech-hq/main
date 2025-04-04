import { schema } from 'yaschema';

import { mailIdInfo } from '../../modules/mail-types/MailId.ts';

export const storedMailSchema = schema.object({
  id: mailIdInfo.schema,
  from: schema.string(),
  to: schema.string(),
  subject: schema.string(),
  body: schema.string(),
  timeMSec: schema.number()
});
export type StoredMail = typeof storedMailSchema.valueType;
