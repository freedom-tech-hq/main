import { isoDateTimeSchema, uint8ArraySchema } from 'freedom-basic-data';
import { emailUserIdInfo } from 'freedom-email-sync';
import { schema } from 'yaschema';

/**
 * Type representing valid message folders
 */
export const messageFolders = ['inbox', 'outbox', 'sent', 'drafts'] as const;
export type MessageFolder = (typeof messageFolders)[number];

/**
 * Schema for server-side message storage
 */
export const dbMessageSchema = schema.object({
  // Open fields
  id: schema.string(),
  userId: emailUserIdInfo.schema,
  transferredAt: isoDateTimeSchema,
  folder: schema.string<MessageFolder>(...messageFolders),

  // Encrypted fields
  listMessage: uint8ArraySchema,
  viewMessage: uint8ArraySchema,
  rawMessage: uint8ArraySchema
});

export type DbMessage = typeof dbMessageSchema.valueType;
