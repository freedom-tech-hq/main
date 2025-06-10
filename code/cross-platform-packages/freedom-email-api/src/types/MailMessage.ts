import { isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { emailUserIdInfo } from './EmailUserId.ts';
import { mailAddressSchema } from './MailAddress.ts';
import { mailAddressListSchema } from './MailAddressList.ts';
import { mailIdInfo } from './MailId.ts';
import { mailPrioritySchema } from './MailPriority.ts';
import { mailThreadIdInfo } from './MailThreadId.ts';
import { messageFolderSchema } from './MessageFolder.ts';

/*
  RFC standards are complex: https://serverfault.com/questions/755654/which-rfcs-should-be-cited-as-internet-standards
  Short take: rely on those with status Proposed Standard or Internet Standard.
  The statement not to take 'Proposed Standard' seriously is obsolete.
 */

// MVP version: raw email with headers as in SMTP
// Make it empty for drafts and outbound emails
export const rawMessageFieldSchema = schema.string().allowNull();

export const mailMessageSchema = schema.object({
  // ### Open fields ###
  id: mailIdInfo.schema,
  userId: emailUserIdInfo.schema,
  // Use this field to render the date in the UI
  // For incoming messages, it is the time when our server received the message. Immutable
  // For sent messages, it is the time when the message was posted to the delivery node. Immutable
  // For drafts, it is the time when the draft was last saved. Mutable, always up to date
  updatedAt: isoDateTimeSchema,
  folder: messageFolderSchema,
  threadId: mailThreadIdInfo.schema,
  // It is external, so allowing empty string to avoid runtime failures
  messageId: schema.string().allowEmptyString().allowNull(),
  // TODO: Place isRead somewhere

  // ### Decoded listFields ###
  subject: schema.string().allowEmptyString(), // If absent, setting to empty
  from: mailAddressListSchema, // Can be plural, and even with empty groups: RFC 6854
  sender: mailAddressSchema.optional(), // Should be singular. Renders as 'From: <Sender> on behalf of <From>'.
  priority: mailPrioritySchema.optional(),
  snippet: schema.string().allowEmptyString(),

  // ### Decoded viewFields ###
  to: mailAddressListSchema,
  cc: mailAddressListSchema,
  bcc: mailAddressListSchema.optional(), // Only exist in the outbound emails
  replyTo: mailAddressListSchema.optional(),
  // seemingly included in the mailAddress // onBehalf: schema.string().allowEmptyString().optional(), // Assuming string, can be refined if needed

  // Only two modes: html and plain text
  // This is not the complete data, server decides what the client will use to render and saves only that part
  // The logic is primitive: if html is available, use it, otherwise use plain text
  // The complete data is saved in DbMessage.raw and is rarely demanded by the frontend
  isBodyHtml: schema.boolean(),
  body: schema.string().allowEmptyString(),

  // If we forbid empty string for these, we are at risk of getting runtime exceptions in the receiving code
  // because it is close to impossible to recall this limitation when saving a message parsed by 3rd-party libraries
  inReplyTo: schema.string().allowEmptyString().optional(),
  references: schema.array({ items: schema.string() }).optional(),

  // This header is inserted by the sending client, so it is not reliable, use lastUpdatedAt instead
  // or `mail.date ?? mail.lastUpdatedAt`
  date: isoDateTimeSchema.optional(),
  // ### End of Decoded viewFields ###

  // ### Decoded raw ###
  raw: rawMessageFieldSchema,

  // ### Dynamic ###
  // TODO: // listAttachments - to render the list
  // TODO // attachments - full data, to input them?
  hasAttachments: schema.boolean()
});

export type MailMessage = typeof mailMessageSchema.valueType;

export const openFieldsOfMessageSchema = schema.pick(mailMessageSchema, [
  // prettier-fix
  'id',
  'userId',
  'updatedAt',
  'folder'
  // 'isRead'?
]);

export const listFieldsOfMessageSchema = schema.pick(mailMessageSchema, [
  // prettier-fix
  'subject',
  'from',
  'sender',
  'priority',
  'snippet'
]);

export const viewFieldsOfMessageSchema = schema.pick(mailMessageSchema, [
  'to',
  'cc',
  'bcc',
  'replyTo',
  'isBodyHtml',
  'body',

  // Not probably used, but we may want to render them at some point
  // 'messageId', // The ids are tracked by the server, so it is not trivial to encrypt them on the client. Skipping for now
  // TODO: Must hash in the future for server and encrypt for reading on the client, because they reveal the source mail domain
  'inReplyTo',
  'references',
  'date'
]);
