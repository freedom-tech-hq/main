import { base64String } from 'freedom-basic-data';
import { emailUserIdInfo, mailIdInfo } from 'freedom-email-sync';
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
  // ### Open fields ###
  id: mailIdInfo.schema,
  userId: emailUserIdInfo.schema,
  transferredAt: schema.date(),
  folder: schema.string<MessageFolder>(...messageFolders),
  threadId: schema.string().allowNull(),

  // ### Encrypted fields ###
  listMessage: base64String.schema,
  viewMessage: base64String.schema,
  rawMessage: base64String.schema

  // Note: on the first migration, add a formatVersion field here
});

export type DbMessage = typeof dbMessageSchema.valueType;
