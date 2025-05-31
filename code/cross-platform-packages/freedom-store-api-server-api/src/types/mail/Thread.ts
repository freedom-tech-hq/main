import { base64String, isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

// Should match DbThread and the shared part of DecryptedThread.
// Cannot include here TODO: revise code structure
export const threadSchema = schema.object({
  // Open fields
  id: schema.string(),
  // assumed // userId,

  // Encrypted fields
  thread: base64String.schema,

  // Dynamic
  messageCount: schema.number(),

  // Dynamic, of the last (unread?) message
  transferredAt: isoDateTimeSchema,
  listMessage: base64String.schema,
  hasAttachments: schema.boolean()
});

export type Thread = typeof threadSchema.valueType;
