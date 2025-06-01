import { randomUUID } from 'node:crypto';

import { makeAsyncResultFunc, type PR } from 'freedom-async';
import { userEncryptValue } from 'freedom-crypto-service';

import type { ApiMessage } from '../types/ApiMessage.ts';
import type { DecryptedMessage } from '../types/DecryptedMessage.ts';

export const encryptMessage = makeAsyncResultFunc([import.meta.filename], async (_trace, mail: DecryptedMessage): PR<ApiMessage> => {
  const messageId = randomUUID();
  const transferredAt = new Date(mail.timeMSec);
  const folder: DbMessage['folder'] = 'inbox';

  // listMessage
  const listMessageResult = await userEncryptValue(trace, {
    schema: decryptedListMessagePartSchema,
    value: {
      subject: mail.subject,
      from: mail.from,
      priority: 'normal',
      snippet: mail.body // TODO: Don't forget to trim
    },
    publicKeys: user.value.publicKeys
  });
  if (!listMessageResult.ok) {
    return listMessageResult;
  }

  // viewMessage
  const viewMessageResult = await userEncryptValue(trace, {
    schema: decryptedViewMessagePartSchema,
    value: {
      from: {
        address: mail.from,
        name: mail.fromName
      },
      to: mail.to.map((address) => ({ address })),
      cc: (mail.cc || []).map((address) => ({ address })),
      // onBehalf: '',
      body: mail.body
    },
    publicKeys: user.value.publicKeys
  });
  if (!viewMessageResult.ok) {
    return viewMessageResult;
  }

  // rawMessage
  const rawMessageResult = await userEncryptValue(trace, {
    schema: storedMailSchema,
    value: mail,
    publicKeys: user.value.publicKeys
  });
  if (!rawMessageResult.ok) {
    return rawMessageResult;
  }

  return makeSuccess<ApiMessage>({});
});
