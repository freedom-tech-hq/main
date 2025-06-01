import { isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

export const decryptedThreadPartSchema = schema.object({
  subject: schema.string(),
  snippet: schema.string()
});

// Note: thread does not have list and view variants.
// It is always a list version, while the view is a list of ViewMessage.
export const decryptedThreadSchema = schema.object({
  // ### Open fields ###
  id: schema.string(),
  // assumed // userId,

  // ### Dynamic ###
  // Do we need this // messageIds: schema.array(schema.string()),
  messageCount: schema.number(),

  // ### Dynamic, of the last (unread?) message, see DecryptedListMessage ###
  transferredAt: isoDateTimeSchema,
  subject: schema.string().allowEmptyString(),
  snippet: schema.string().allowEmptyString(), // always plain text, single line, trimmed at 100 chars
  hasAttachments: schema.boolean() // From the same message as listMessage
});

export type DecryptedThread = typeof decryptedThreadSchema.valueType;
