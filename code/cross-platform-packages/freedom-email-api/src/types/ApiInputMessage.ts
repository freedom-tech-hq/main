import { schema } from 'yaschema';

import { type ApiMessage, apiMessageSchema } from './ApiMessage.ts';

const excludedFromInputMessage = [
  // Exclude server-controlled fields
  'id', // it is globally unique in simple REST model, so it cannot be client-controlled as in local-first
  'userId',
  'updatedAt',
  'folder', // always 'drafts' for user and 'inbox' for MailAgent
  // We save raw only for inbound messages. We currently don't even expose it to the client
  'raw',
  // Exclude all dynamic fields
  'hasAttachments'
  // TODO: 'attachments'
] as const satisfies (keyof ApiMessage)[];

export type ExcludedFromInputMessage = (typeof excludedFromInputMessage)[number];

export const apiInputMessageSchema = schema.omit(apiMessageSchema, excludedFromInputMessage);

export type ApiInputMessage = Omit<ApiMessage, ExcludedFromInputMessage>;
