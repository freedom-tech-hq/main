import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { dbQuery, findUserByEmail } from 'freedom-db';
import type { types } from 'freedom-email-api';
import { clientApi } from 'freedom-email-api';

export const addIncomingEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, recipientEmail: string, mail: types.DecryptedMessage): PR<undefined> => {
    // Load user keys
    const user = await findUserByEmail(trace, recipientEmail);
    if (!user.ok) {
      return generalizeFailureResult(trace, user, 'not-found');
    }

    const apiMessageResult = await clientApi.encryptMessageToSave(trace, user.value.publicKeys, mail);
    if (!apiMessageResult.ok) {
      return apiMessageResult;
    }

    const sql = `
      INSERT INTO "messages" ("id", "userId", "transferredAt", "folder", "listFields", "viewFields", "raw")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const params: unknown[] = [
      apiMessageResult.value.id,
      user.value.userId,
      apiMessageResult.value.transferredAt,
      apiMessageResult.value.folder,
      apiMessageResult.value.listFields,
      apiMessageResult.value.viewFields,
      apiMessageResult.value.raw
    ];

    await dbQuery(sql, params);

    return makeSuccess(undefined);
  }
);
