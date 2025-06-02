import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { type DbMessage, dbQuery, findUserByEmail } from 'freedom-db';
import type { types } from 'freedom-email-api';
import { clientApi } from 'freedom-email-api';

export const addIncomingEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, recipientEmail: string, mail: types.DecryptedInputMessage): PR<undefined> => {
    const transferredAt = new Date();
    const folder: DbMessage['folder'] = 'inbox';

    // TODO: Add envelope.from as 'Return-Path' header.
    //  See discussion at https://stackoverflow.com/questions/4367358/whats-the-difference-between-sender-from-and-return-path#comment48064981_25873119

    // Load user keys
    const user = await findUserByEmail(trace, recipientEmail);
    if (!user.ok) {
      return generalizeFailureResult(trace, user, 'not-found');
    }

    const apiMessageResult = await clientApi.encryptMessageToSave(trace, user.value.publicKeys, mail);
    if (!apiMessageResult.ok) {
      return apiMessageResult;
    }

    // TODO: Extract save with schema validation
    const sql = `
      INSERT INTO "messages" ("id", "userId", "transferredAt", "folder", "listFields", "viewFields", "raw")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const params: unknown[] = [
      apiMessageResult.value.id,
      user.value.userId,
      transferredAt,
      folder,
      apiMessageResult.value.listFields,
      apiMessageResult.value.viewFields,
      apiMessageResult.value.raw
    ];

    await dbQuery(sql, params);

    return makeSuccess(undefined);
  }
);
