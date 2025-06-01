import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import { userEncryptValue } from 'freedom-crypto-service';
import { schema } from 'yaschema';

import type { ApiMessage } from '../types/ApiMessage.ts';
import { type DecryptedMessage, listFieldsOfMessageSchema, viewFieldsOfMessageSchema } from '../types/DecryptedMessage.ts';
import { getMessageOpenFields } from './getMessageOpenFields.ts';

export const encryptMessageToSave = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, publicKeys: CombinationCryptoKeySet, mail: DecryptedMessage): PR<ApiMessage> => {
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

    return makeSuccess<ApiMessage>({
      ...getMessageOpenFields(mail),
      // id: mail.id,
      // userId: mail.userId,
      // transferredAt: mail.transferredAt,
      // folder: mail.folder,
      listFields: listFieldsResult.value,
      viewFields: viewFieldsResult.value,
      raw: rawMessageResult.value
      // hasAttachments: mail.hasAttachments
    });
  }
);
