import { base64String, isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

// Should match DbMessage and the shared part of DecryptedListMessage.
// Cannot include here TODO: revise code structure
export const listMessageSchema = schema.object({
  // Open fields
  id: schema.string(),
  // assumed // userId,
  transferredAt: isoDateTimeSchema,
  // assumed // folder,

  // Encrypted fields
  listMessage: base64String.schema,

  // Dynamic
  hasAttachments: schema.boolean()
});

export type ListMessage = typeof listMessageSchema.valueType;
