import { isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const decryptedViewMessagePartSchema = schema.object({
  from: schema.string(),
  to: schema.string(), // TODO: Make typing
  cc: schema.string(),
  onBehalf: schema.string().optional(), // Assuming string, can be refined if needed
  body: schema.string()
});

export const decryptedViewMessageSchema = schema.object({
  // Open fields
  id: schema.string(),
  // assumed // userId,
  transferredAt: isoDateTimeSchema,
  // assumed // folder,

  // Decoded viewMessage
  from: schema.string(),
  to: schema.string(),
  cc: schema.string(),
  onBehalf: schema.string().optional(), // Assuming string, can be refined if needed
  body: schema.string()

  // Dynamic
  // TODO: attachments
});

export type DecryptedViewMessage = typeof decryptedViewMessageSchema.valueType;
