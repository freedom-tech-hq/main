import { schema } from 'yaschema';

import { apiListMessageSchema } from './ApiListMessage.ts';
import { mailThreadLikeIdSchema } from './MailThreadLikeId.ts';

// Should match DbThread and the shared part of DecryptedThread.
// Cannot include here TODO: revise code structure
export const apiThreadSchema = schema.object({
  // Open fields
  id: mailThreadLikeIdSchema,
  // assumed // userId,

  // Encrypted fields
  // no need // thread: base64String.schema,

  // Dynamic
  messageCount: schema.number(),

  // Dynamic, of the last (unread?) message
  lastMessage: apiListMessageSchema
});

export type ApiThread = typeof apiThreadSchema.valueType;
