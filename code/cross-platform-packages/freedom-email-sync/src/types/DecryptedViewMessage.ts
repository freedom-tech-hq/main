import { isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { mailAddressListSchema, mailAddressSchema, mailPrioritySchema } from './headerTypes.ts';
import { mailIdInfo } from './MailId.ts';

export const decryptedViewMessagePartSchema = schema.object({
  from: schema.string(),
  to: schema.string().allowEmptyString(), // TODO: Make typing
  cc: schema.string().allowEmptyString(),
  onBehalf: schema.string().allowEmptyString().optional(), // Assuming string, can be refined if needed
  body: schema.string().allowEmptyString()
});

export const decryptedViewMessageSchema = schema.object({
  // ### Open fields ###
  id: mailIdInfo.schema,
  // assumed // userId,
  transferredAt: isoDateTimeSchema, // TODO: Rename to lastUpdatedAt
  // assumed // folder,

  // ### Decoded listMessage ###
  subject: schema.string().allowEmptyString(),

  // ### Decoded viewMessage ###
  from: mailAddressSchema,
  to: mailAddressListSchema,
  cc: mailAddressListSchema,
  bcc: mailAddressListSchema.optional(), // Only exist in the outbound emails
  replyTo: mailAddressSchema.optional(),
  priority: mailPrioritySchema.optional(),
  // seemingly included in the mailAddress // onBehalf: schema.string().allowEmptyString().optional(), // Assuming string, can be refined if needed

  // Only two modes: html and plain text
  // This is not the complete data, server decides what the client will use to render and saves only that part
  // The logic is primitive: if html is available, use it, otherwise use plain text
  // The complete data is saved in DbMessage.rawMessage and is rarely demanded by the frontend
  isBodyHtml: schema.boolean(),
  body: schema.string().allowEmptyString(),

  // ### Not probably used, but we may want to render them at some point ###
  // If we forbid empty string for these, we are at risk of getting runtime exceptions in the receiving code
  // because it is close to impossible to recall this limitation when saving a message parsed by 3rd-party libraries
  messageId: schema.string().allowEmptyString().optional(),
  inReplyTo: schema.string().allowEmptyString().optional(),
  references: schema.array(schema.string()).optional(),

  // This header is inserted by the sending client, so it is not reliable, use lastUpdatedAt instead
  // or `mail.date ?? mail.lastUpdatedAt`
  date: isoDateTimeSchema.optional()

  // ### Dynamic ###
  // TODO // attachments: schema.array(decryptedAttachmentSchema)
});

export type DecryptedViewMessage = typeof decryptedViewMessageSchema.valueType;
