import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeIsoDateTime } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import { encryptValue } from 'freedom-crypto';
import { type DbMessageIn, dbQuery, findUserByEmail } from 'freedom-db';
import { clientApi, types } from 'freedom-email-api';

export const addIncomingEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, recipientEmail: string, mail: types.DecryptedInputMessage, raw: string | null): PR<undefined> => {
    const updatedAt = new Date();
    // TODO: Extract a function
    // TODO: Remove time from the id because updatedAt is server-controlled
    const id = types.mailIdInfo.make(`${makeIsoDateTime(updatedAt)}-${makeUuid()}`);

    const folder: types.MessageFolder = 'inbox';

    // TODO: Add envelope.from as 'Return-Path' header.
    //  See discussion at https://stackoverflow.com/questions/4367358/whats-the-difference-between-sender-from-and-return-path#comment48064981_25873119

    // Load user keys
    const user = await findUserByEmail(trace, recipientEmail);
    if (!user.ok) {
      return generalizeFailureResult(trace, user, 'not-found');
    }

    const apiMessageResult = await clientApi.encryptInputMessage(trace, user.value.publicKeys, mail);
    if (!apiMessageResult.ok) {
      return apiMessageResult;
    }

    // raw
    let rawField: DbMessageIn['raw'] = null;
    if (raw !== null) {
      const rawFieldResult = await encryptValue(trace, {
        valueSchema: types.rawMessageFieldSchema,
        value: raw,
        encryptingKeys: user.value.publicKeys
      });
      if (!rawFieldResult.ok) {
        return rawFieldResult;
      }
      rawField = rawFieldResult.value;
    }

    // TODO: Extract save with schema validation
    const sql = `
      INSERT INTO "messages" ("id", "userId", "updatedAt", "folder", "listFields", "viewFields", "raw")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const params: unknown[] = [
      id,
      user.value.userId,
      updatedAt,
      folder,
      apiMessageResult.value.listFields,
      apiMessageResult.value.viewFields,
      rawField
    ];

    await dbQuery(sql, params);

    return makeSuccess(undefined);
  }
);
