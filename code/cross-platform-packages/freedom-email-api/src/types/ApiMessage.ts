import { base64String, isoDateTimeSchema } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { emailUserIdInfo } from './EmailUserId.ts';
import { mailIdInfo } from './MailId.ts';
import { messageFolderSchema } from './MessageFolder.ts';

// Should match DbMessage and the shared part of DecryptedMessage.
export const apiMessage = schema.object({
  // ### Open fields ###
  id: mailIdInfo.schema,
  userId: emailUserIdInfo.schema,
  transferredAt: isoDateTimeSchema,
  folder: messageFolderSchema,
  // TODO: Place isRead somewhere

  // ### Encrypted fields ###
  listFields: base64String.schema,
  viewFields: base64String.schema,
  raw: base64String.schema,

  // ### Dynamic ###
  // TODO: // listAttachments - to render the list
  // TODO // attachments - full data, to input them?
  hasAttachments: schema.boolean()
});

export type ApiMessage = typeof apiMessage.valueType;
