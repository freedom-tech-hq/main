import { randomUUID } from 'node:crypto';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { userEncryptValue } from 'freedom-crypto-service';
import { type DbMessage, dbQuery, findUserByEmail } from 'freedom-db';
import { type DecryptedMessage, storedMailSchema } from 'freedom-email-sync';
import { decryptedListMessagePartSchema, decryptedViewMessagePartSchema } from 'freedom-email-sync';

export const addIncomingEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, recipientEmail: string, mail: DecryptedMessage): PR<undefined> => {
    const messageId = randomUUID();
    const transferredAt = new Date(mail.timeMSec);
    const folder: DbMessage['folder'] = 'inbox';

    // Load user keys
    const user = await findUserByEmail(trace, recipientEmail);
    if (!user.ok) {
      return generalizeFailureResult(trace, user, 'not-found');
    }

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

    // raw
    const rawMessageResult = await userEncryptValue(trace, {
      schema: storedMailSchema,
      value: mail,
      publicKeys: user.value.publicKeys
    });
    if (!rawMessageResult.ok) {
      return rawMessageResult;
    }

    const sql = `
      INSERT INTO "messages" ("id", "userId", "transferredAt", "folder", "listMessage", "viewMessage", "raw")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const params: unknown[] = [
      messageId,
      user.value.userId,
      transferredAt,
      folder,
      listMessageResult.value,
      viewMessageResult.value,
      rawMessageResult.value
    ];

    await dbQuery(sql, params);

    return makeSuccess(undefined);
  }
);
