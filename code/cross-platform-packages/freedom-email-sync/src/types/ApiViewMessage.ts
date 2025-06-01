import { base64String, isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { mailIdInfo } from './MailId.ts';

// Should match DbMessage and the shared part of DecryptedListMessage.
// Cannot include here TODO: revise code structure
export const apiViewMessageSchema = schema.object({
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

export type ApiViewMessage = typeof apiViewMessageSchema.valueType;
