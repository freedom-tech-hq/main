import { nonNegativeIntegerSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const mailSummarySchema = schema.object({
  from: schema.string(),
  subject: schema.string(),
  bodyAbbrev: schema.string(),
  numAttachments: nonNegativeIntegerSchema,
  messageBytes: nonNegativeIntegerSchema
});
export type MailSummary = typeof mailSummarySchema.valueType;
