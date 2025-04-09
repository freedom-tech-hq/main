import { nonNegativeIntegerSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const attachmentInfoSchema = schema.object({
  mimeType: schema.string(),
  sizeBytes: nonNegativeIntegerSchema,
  numChunks: nonNegativeIntegerSchema
});
export type AttachmentInfo = typeof attachmentInfoSchema.valueType;
