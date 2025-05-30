import { nonNegativeIntegerSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { mailAttachmentIdInfo } from './MailAttachmentId.ts';

export const mailAttachmentInfoSchema = schema.object({
  id: mailAttachmentIdInfo.schema,
  mimeType: schema.string(),
  sizeBytes: nonNegativeIntegerSchema,
  numChunks: nonNegativeIntegerSchema
});
export type MailAttachmentInfo = typeof mailAttachmentInfoSchema.valueType;
