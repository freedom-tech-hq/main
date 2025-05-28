import { uint8ArraySchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

/**
 * Schema for server-side email attachment storage
 */
export const dbAttachmentSchema = schema.object({
  // Open fields
  id: schema.string(),
  messageId: schema.string(),

  // Encrypted fields
  meta: uint8ArraySchema,
  content: uint8ArraySchema
});

export type DbAttachment = typeof dbAttachmentSchema.valueType;
