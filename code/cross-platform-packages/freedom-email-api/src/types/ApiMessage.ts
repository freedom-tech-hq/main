import { base64String, isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { emailUserIdInfo } from './EmailUserId.ts';
import { mailIdInfo } from './MailId.ts';
import { mailThreadIdInfo } from './MailThreadId.ts';
import { messageFolderSchema } from './MessageFolder.ts';

// Should match DbMessage and the shared part of MailMessage.
export const apiMessageSchema = schema.object({
  // ### Open fields ###
  id: mailIdInfo.schema,
  userId: emailUserIdInfo.schema,
  updatedAt: isoDateTimeSchema,
  folder: messageFolderSchema,
  threadId: mailThreadIdInfo.schema,

  // External id, is optional in decrypted version
  // It is temporary open, to prototype the logic TODO: make encrypted or hashed
  messageId: schema.string().allowNull(),
  // TODO: Place isRead somewhere

  // ### Encrypted fields ###
  listFields: base64String.schema,
  viewFields: base64String.schema,
  raw: base64String.schema.allowNull(),

  // ### Dynamic ###
  // TODO: // listAttachments - to render the list
  // TODO // attachments - full data, to input them?
  hasAttachments: schema.boolean()
});

export type ApiMessage = typeof apiMessageSchema.valueType;
