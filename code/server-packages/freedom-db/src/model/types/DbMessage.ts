import { types } from 'freedom-email-api';
import { schema } from 'yaschema';

/**
 * Type representing valid message folders
 */
export const messageFolders = ['inbox', 'outbox', 'sent', 'drafts'] as const;
export type MessageFolder = (typeof messageFolders)[number];

/**
 * Schema for server-side message storage
 */
export const dbMessageSchema = schema.omit(types.apiMessageSchema, [
  // Dynamic
  'hasAttachments'
]);

export type DbMessage = typeof dbMessageSchema.valueType;
