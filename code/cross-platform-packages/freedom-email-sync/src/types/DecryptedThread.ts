import { isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const decryptedThreadPartSchema = schema.object({
  subject: schema.string(),
  snippet: schema.string()
});

export const decryptedThreadSchema = schema.object({
  // Open fields
  id: schema.string(),
  // assumed // userId,
  transferredAt: isoDateTimeSchema,
  // assumed // folder,

  // Decoded thread
  subject: schema.string(),
  snippet: schema.string(),

  // Messages in thread
  messageIds: schema.array(schema.string()),

  // Dynamic
  hasAttachments: schema.boolean(),
  messageCount: schema.number()
});

export type DecryptedThread = typeof decryptedThreadSchema.valueType;
