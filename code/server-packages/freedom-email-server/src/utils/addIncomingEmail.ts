import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { userEncryptValue } from 'freedom-crypto-service';
import { type DbMessage, dbQuery, findUserByEmail } from 'freedom-db';
import { type StoredMail } from 'freedom-email-sync';
import { decryptedListMessagePartSchema, decryptedViewMessagePartSchema } from 'freedom-email-sync';

export const addIncomingEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, recipientEmail: string, mail: StoredMail): PR<undefined> => {
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
        snippet: mail.body // TODO: Don't forget to trim
      },
      publicKeys: user.value.publicKeys
    });
    if (!listMessageResult.ok) {
      return listMessageResult;
    }
    const listMessage = listMessageResult.value;

    // viewMessage
    const viewMessageResult = await userEncryptValue(trace, {
      schema: decryptedViewMessagePartSchema,
      value: {
        from: mail.from,
        to: mail.to.join(', '),
        cc: mail.cc?.join(', ') ?? '',
        onBehalf: '',
        body: mail.body
      },
      publicKeys: user.value.publicKeys
    });
    if (!viewMessageResult.ok) {
      return viewMessageResult;
    }

    // rawMessage
    const rawMessage = Buffer.from(mail.body ?? '').toString('base64'); // Assuming rawMessage is also the body for now

    const sql = `
      INSERT INTO "messages" ("id", "userId", "transferredAt", "folder", "listMessage", "viewMessage", "rawMessage")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const params: unknown[] = [
      messageId,
      recipientEmail, // This is a string, matching the 'users'.'userId' TEXT column type
      transferredAt,
      folder,
      listMessage,
      viewMessage,
      rawMessage
    ];

    await dbQuery(sql, params);

    return makeSuccess(undefined);
  }
);
