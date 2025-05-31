import { base64String, isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

// Should match DbThread and the shared part of DecryptedThread.
// Cannot include here TODO: revise code structure
export const threadSchema = schema.object({
  // Open fields
  id: schema.string(),
  // assumed // userId,
  transferredAt: isoDateTimeSchema,

  // Encrypted fields
  thread: base64String.schema,
  
  // Dynamic
  messageCount: schema.number(),
  hasAttachments: schema.boolean()
});

export type Thread = typeof threadSchema.valueType;
