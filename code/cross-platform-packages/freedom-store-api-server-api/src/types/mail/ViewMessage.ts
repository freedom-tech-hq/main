import { base64String, isoDateTimeSchema } from 'freedom-basic-data';
import { mailIdInfo } from 'freedom-email-sync';
import { schema } from 'yaschema';

// Should match DbMessage and the shared part of DecryptedListMessage.
// Cannot include here TODO: revise code structure
export const viewMessageSchema = schema.object({
  // Open fields
  id: mailIdInfo.schema,
  // assumed // userId,
  transferredAt: isoDateTimeSchema,
  // assumed // folder,

  // Encrypted fields
  listMessage: base64String.schema,
  viewMessage: base64String.schema

  // Dynamic
  // TODO: attachments
});

export type ViewMessage = typeof viewMessageSchema.valueType;
