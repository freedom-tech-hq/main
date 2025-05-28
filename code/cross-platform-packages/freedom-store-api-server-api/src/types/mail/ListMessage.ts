import { isoDateTimeSchema, uint8ArraySchema } from 'freedom-basic-data';
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
  listMessage: uint8ArraySchema,

  // Dynamic
  hasAttachments: schema.boolean()
});

export type ListMessage = typeof listMessageSchema.valueType;
