import { schema } from 'yaschema';

import { type ApiMessage, apiMessageSchema } from './ApiMessage.ts';

const excludedFromInputMessage = [
  // Exclude server-controlled fields
  'id', // it is globally unique in simple REST model, so it cannot be client-controlled as in local-first
  'userId',
  'updatedAt',
  'folder', // always 'drafts' for user and 'inbox' for MailAgent
  'messageId', // For our messages, it is automatic to <id@domain>
  'threadId', // Pass inReplyTo instead
  // We save raw only for inbound messages. We currently don't even expose it to the client
  'raw',
  // Exclude all dynamic fields
  'hasAttachments'
  // TODO: 'attachments'
] as const satisfies (keyof ApiMessage)[];

export type ExcludedFromInputMessage = (typeof excludedFromInputMessage)[number];

export const apiInputMessageSchema = schema.allOf(
  schema.omit(apiMessageSchema, excludedFromInputMessage),
  schema.object({
    // This is not going to be saved as an open field, but it goes to the backend in open form
    // string = link to a thread with that message. Do not allow empty string for internal messages
    // undefined = unlink from any thread (= a virtual thread with this only message)
    // There's no option to preserve the old value on save, as this should be synchronized with viewFields.inReplyTo encrypted on the client
    inReplyTo: schema.string().optional()
  })
);

export type ApiInputMessage = typeof apiInputMessageSchema.valueType;
