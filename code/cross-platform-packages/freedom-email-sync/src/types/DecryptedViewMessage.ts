import { isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const decryptedViewMessagePartSchema = schema.object({
  from: schema.string(),
  to: schema.string().allowEmptyString(), // TODO: Make typing
  cc: schema.string().allowEmptyString(),
  onBehalf: schema.string().allowEmptyString().optional(), // Assuming string, can be refined if needed
  body: schema.string().allowEmptyString()
});

export const decryptedViewMessageSchema = schema.object({
  // Open fields
  id: schema.string(),
  // assumed // userId,
  transferredAt: isoDateTimeSchema,
  // assumed // folder,

  // Decoded viewMessage
  from: schema.string(),
  to: schema.string().allowEmptyString(),
  cc: schema.string().allowEmptyString(),
  onBehalf: schema.string().allowEmptyString().optional(), // Assuming string, can be refined if needed
  body: schema.string().allowEmptyString()

  // Dynamic
  // TODO: attachments
});

export type DecryptedViewMessage = typeof decryptedViewMessageSchema.valueType;
