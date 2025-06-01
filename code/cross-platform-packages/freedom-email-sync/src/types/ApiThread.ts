import { base64String, isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

// Should match DbThread and the shared part of DecryptedThread.
// Cannot include here TODO: revise code structure
export const apiThreadSchema = schema.object({
  // Open fields
  id: schema.string(),
  // assumed // userId,

  // Encrypted fields
  // no need // thread: base64String.schema,

  // Dynamic
  messageCount: schema.number(),

  // Dynamic, of the last (unread?) message
  transferredAt: isoDateTimeSchema,
  // TODO: isRead
  listMessage: base64String.schema,
  hasAttachments: schema.boolean()
});

export type ApiThread = typeof apiThreadSchema.valueType;
