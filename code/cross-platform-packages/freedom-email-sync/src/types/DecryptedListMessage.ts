import { isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { mailAddressSchema, mailPrioritySchema } from './headerTypes.ts';
import { mailIdInfo } from './MailId.ts';

// ### Decrypted listMessage API field ###
export const decryptedListMessagePartSchema = schema.object({
  subject: schema.string(),
  from: mailAddressSchema,
  priority: mailPrioritySchema.optional(),
  snippet: schema.string()
});

// TODO: DRY with API and decryptedListMessagePartSchema
export const decryptedListMessageSchema = schema.allOf(
  schema.object({
    // ### Open fields ###
    id: mailIdInfo.schema,
    // assumed // userId,
    transferredAt: isoDateTimeSchema,
    // assumed // folder,
    // TODO: Place isRead somewhere

    // ### Dynamic ###
    hasAttachments: schema.boolean()
  }),
  decryptedListMessagePartSchema
);

export type DecryptedListMessage = typeof decryptedListMessageSchema.valueType;
