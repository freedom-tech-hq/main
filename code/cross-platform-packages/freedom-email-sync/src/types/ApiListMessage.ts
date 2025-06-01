import { base64String, isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { mailIdInfo } from './MailId.ts';

// Should match DbMessage and the shared part of DecryptedListMessage.
// Cannot include here TODO: revise code structure
export const apiListMessageSchema = schema.object({
  // Open fields
  id: mailIdInfo.schema,
  // assumed // userId,
  transferredAt: isoDateTimeSchema,
  // assumed // folder,

  // Encrypted fields
  listMessage: base64String.schema,

  // Dynamic
  hasAttachments: schema.boolean()
});

export type ApiListMessage = typeof apiListMessageSchema.valueType;
