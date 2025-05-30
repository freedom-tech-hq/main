import { schema } from 'yaschema';

import { mailAttachmentInfoSchema } from './MailAttachmentInfo.ts';

export const storedMailSchema = schema.object({
  from: schema.string(),
  to: schema.array({ items: schema.string() }),
  cc: schema.array({ items: schema.string() }).optional(),
  bcc: schema.array({ items: schema.string() }).optional(),
  subject: schema.string(),
  body: schema.string(),
  timeMSec: schema.number(),
  attachments: schema.array({ items: mailAttachmentInfoSchema })
});
export type StoredMail = typeof storedMailSchema.valueType;
