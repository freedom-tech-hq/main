import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import { userEncryptValue } from 'freedom-crypto-service';
import { schema } from 'yaschema';

import type { ApiInputMessage } from '../types/ApiInputMessage.ts';
import type { DecryptedInputMessage } from '../types/DecryptedInputMessage.ts';
import { listFieldsOfMessageSchema, viewFieldsOfMessageSchema } from '../types/MailMessage.ts';

export const encryptMessageToSave = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, publicKeys: CombinationCryptoKeySet, mail: DecryptedInputMessage): PR<ApiInputMessage> => {
    // listFields
    const listFieldsResult = await userEncryptValue(trace, {
      schema: listFieldsOfMessageSchema,
      value: {
        // TODO: Consider passing the whole object, the schema will pick the relevant fields
        ...mail
        // subject: mail.subject,
        // from: mail.from,
        // priority: mail.priority,
        // snippet: mail.snippet
      },
      publicKeys
    });
    if (!listFieldsResult.ok) {
      return listFieldsResult;
    }

    // viewFields
    const viewFieldsResult = await userEncryptValue(trace, {
      schema: viewFieldsOfMessageSchema,
      value: {
        ...mail
        // to: mail.to,
        // cc: mail.cc,
        // bcc: mail.bcc,
        // replyTo: mail.replyTo,
        //
        // isBodyHtml: mail.isBodyHtml,
        // body: mail.body,
        //
        // messageId: mail.messageId,
        // inReplyTo: mail.inReplyTo,
        // references: mail.references,
        //
        // date: mail.date
      },
      publicKeys
    });
    if (!viewFieldsResult.ok) {
      return viewFieldsResult;
    }

    // raw
    const rawMessageResult = await userEncryptValue(trace, {
      schema: schema.string(),
      value: mail.raw,
      publicKeys
    });
    if (!rawMessageResult.ok) {
      return rawMessageResult;
    }

    return makeSuccess<ApiInputMessage>({
      id: mail.id,
      // server-controlled:
      // 'userId'
      // 'transferredAt'
      // 'folder' - always 'drafts' for user and 'inbox' for MailAgent
      listFields: listFieldsResult.value,
      viewFields: viewFieldsResult.value,
      raw: rawMessageResult.value
    });
  }
);
