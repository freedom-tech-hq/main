import { isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { emailUserIdInfo } from './EmailUserId.ts';
import { mailAddressListSchema, mailAddressSchema, mailPrioritySchema } from './headerTypes.ts';
import { mailIdInfo } from './MailId.ts';
import { messageFolderSchema } from './MessageFolder.ts';

export const decryptedMessageSchema = schema.object({
  // ### Open fields ###
  id: mailIdInfo.schema,
  userId: emailUserIdInfo.schema,
  transferredAt: isoDateTimeSchema, // TODO: Rename to lastUpdatedAt
  folder: messageFolderSchema,
  // TODO: Place isRead somewhere

  // ### Decoded listMessage ###
  subject: schema.string(),
  from: mailAddressSchema.optional(), // Might be absent for incoming messages. TODO: check can it be plural
  priority: mailPrioritySchema.optional(),
  snippet: schema.string(),

  // ### Decoded viewMessage ###
  to: mailAddressListSchema,
  cc: mailAddressListSchema,
  bcc: mailAddressListSchema.optional(), // Only exist in the outbound emails
  replyTo: mailAddressSchema.optional(),
  // seemingly included in the mailAddress // onBehalf: schema.string().allowEmptyString().optional(), // Assuming string, can be refined if needed

  // Only two modes: html and plain text
  // This is not the complete data, server decides what the client will use to render and saves only that part
  // The logic is primitive: if html is available, use it, otherwise use plain text
  // The complete data is saved in DbMessage.raw and is rarely demanded by the frontend
  isBodyHtml: schema.boolean(),
  body: schema.string().allowEmptyString(),

  // If we forbid empty string for these, we are at risk of getting runtime exceptions in the receiving code
  // because it is close to impossible to recall this limitation when saving a message parsed by 3rd-party libraries
  messageId: schema.string().allowEmptyString().optional(),
  inReplyTo: schema.string().allowEmptyString().optional(),
  references: schema.array(schema.string()).optional(),

  // This header is inserted by the sending client, so it is not reliable, use lastUpdatedAt instead
  // or `mail.date ?? mail.lastUpdatedAt`
  date: isoDateTimeSchema.optional(),
  // ### End of Decoded viewMessage ###

  // ### Decoded raw ###
  raw: schema.string(),

  // ### Dynamic ###
  // TODO: // listAttachments - to render the list
  // TODO // attachments - full data, to input them?
  hasAttachments: schema.boolean()
});

export type DecryptedMessage = typeof decryptedMessageSchema.valueType;

export const listFieldsOfMessageSchema = schema.pick(decryptedMessageSchema, [
  // prettier-fix
  'subject',
  'from',
  'priority',
  'snippet'
]);

export const viewFieldsOfMessageSchema = schema.pick(decryptedMessageSchema, [
  'to',
  'cc',
  'bcc',
  'replyTo',
  'isBodyHtml',
  'body',

  // Not probably used, but we may want to render them at some point
  'messageId',
  'inReplyTo',
  'references',
  'date'
]);

// MVP version: raw email with headers as in SMTP
export const rawMessageFieldSchema = schema.string();
