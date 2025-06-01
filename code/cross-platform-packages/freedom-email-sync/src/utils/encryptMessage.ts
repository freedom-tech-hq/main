import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import { userEncryptValue } from 'freedom-crypto-service';
import { schema } from 'yaschema';

import type { ApiMessage } from '../types/ApiMessage.ts';
import { decryptedListMessagePartSchema } from '../types/DecryptedListMessage.ts';
import type { DecryptedMessage } from '../types/DecryptedMessage.ts';
import { decryptedViewMessagePartSchema } from '../types/DecryptedViewMessage.ts';

export const encryptMessage = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, publicKeys: CombinationCryptoKeySet, mail: DecryptedMessage): PR<ApiMessage> => {
    // listMessage
    const listMessageResult = await userEncryptValue(trace, {
      schema: decryptedListMessagePartSchema,
      value: {
        subject: mail.subject,
        from: mail.from,
        priority: mail.priority,
        snippet: mail.snippet
      },
      publicKeys
    });
    if (!listMessageResult.ok) {
      return listMessageResult;
    }

    // viewMessage
    const viewMessageResult = await userEncryptValue(trace, {
      schema: decryptedViewMessagePartSchema,
      value: {
        from: mail.from,
        to: mail.to,
        cc: mail.cc,
        bcc: mail.bcc,
        replyTo: mail.replyTo,

        isBodyHtml: mail.isBodyHtml,
        body: mail.body,

        messageId: mail.messageId,
        inReplyTo: mail.inReplyTo,
        references: mail.references,

        date: mail.date
      },
      publicKeys
    });
    if (!viewMessageResult.ok) {
      return viewMessageResult;
    }

    // rawMessage
    const rawMessageResult = await userEncryptValue(trace, {
      schema: schema.string(),
      value: mail.rawMessage,
      publicKeys
    });
    if (!rawMessageResult.ok) {
      return rawMessageResult;
    }

    return makeSuccess<ApiMessage>({
      id: mail.id,
      transferredAt: mail.transferredAt,
      folder: mail.folder,
      listMessage: listMessageResult.value,
      viewMessage: viewMessageResult.value,
      rawMessage: rawMessageResult.value
    });
  }
);
