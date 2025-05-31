import { isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { mailAddressSchema, mailPrioritySchema } from './headerTypes.ts';
import { mailIdInfo } from './MailId.ts';

export const decryptedListMessagePartSchema = schema.object({
  subject: schema.string(),
  snippet: schema.string()
});

// TODO: DRY with API and decryptedListMessagePartSchema
export const decryptedListMessageSchema = schema.object({
  // ### Open fields ###
  id: mailIdInfo.schema,
  // assumed // userId,
  transferredAt: isoDateTimeSchema,
  // assumed // folder,
  // TODO: Place isRead somewhere

  // ### Decoded listMessage ###
  subject: schema.string().allowEmptyString(),
  from: mailAddressSchema,
  priority: mailPrioritySchema.optional(),
  snippet: schema.string().allowEmptyString(), // always plain text, single line, trimmed at 100 chars

  // ### Dynamic ###
  hasAttachments: schema.boolean()
});

export type DecryptedListMessage = typeof decryptedListMessageSchema.valueType;
