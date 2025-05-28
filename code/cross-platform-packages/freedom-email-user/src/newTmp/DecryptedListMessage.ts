import { isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const decryptedListMessageSchema = schema.object({
  // Open fields
  id: schema.string(),
  // assumed // userId,
  transferredAt: isoDateTimeSchema,
  // assumed // folder,

  // Decoded listMessage
  subject: schema.string(),
  snippet: schema.string(),

  // Dynamic
  hasAttachments: schema.boolean()
});

export type DecryptedListMessage = typeof decryptedListMessageSchema.valueType;
