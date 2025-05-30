import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { type StoredMail } from 'freedom-email-sync';
import { dbQuery, type DbMessage } from 'freedom-db';
import { crypto } from 'node:crypto'; // For randomUUID
import { Buffer } from 'node:buffer'; // For base64 encoding

export const addIncomingEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, recipientEmail: string, mail: StoredMail): PR<undefined> => {
    const messageId = crypto.randomUUID();
    const transferredAt = new Date(mail.timeMSec);
    const folder: DbMessage['folder'] = 'inbox';

    // According to DbMessage schema, these are Base64String
    const listMessage = Buffer.from(mail.subject ?? '').toString('base64');
    const viewMessage = Buffer.from(mail.body ?? '').toString('base64');
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
