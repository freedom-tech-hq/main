import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeIsoDateTime } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import { encryptValue } from 'freedom-crypto';
import type { DbMessageIn } from 'freedom-db';
import { dbQuery, findUserByEmail, identifyThread } from 'freedom-db';
import { mailThreadIdInfo, type MessageFolder } from 'freedom-email-api';
import { clientApi, mailIdInfo, rawMessageFieldSchema } from 'freedom-email-api';

import type { ParsedMail } from '../../formats/types/ParsedMail.ts';

export const addIncomingEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, recipientEmail: string, mail: ParsedMail): PR<undefined> => {
    const updatedAt = new Date();
    // TODO: Extract a function
    // TODO: Remove time from the id because updatedAt is server-controlled
    //  and consider simplifying the id radically. It is a hell to mock them, a simple string like MAIL_the-id should work.
    const id = mailIdInfo.make(`${makeIsoDateTime(updatedAt)}-${makeUuid()}`);

    const folder: MessageFolder = 'inbox';

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
    if (mail.raw !== null) {
      const rawFieldResult = await encryptValue(trace, {
        valueSchema: rawMessageFieldSchema,
        value: mail.raw,
        encryptingKeys: user.value.publicKeys
      });
      if (!rawFieldResult.ok) {
        return rawFieldResult;
      }
      rawField = rawFieldResult.value;
    }

    // Get threadId using identifyThread function
    const threadResult = await identifyThread(trace, {
      inReplyTo: mail.inReplyTo,
      references: mail.references
    });
    if (!threadResult.ok) {
      return threadResult;
    }

    const threadId = threadResult.value ?? mailThreadIdInfo.make(makeUuid());

    // TODO: Extract save with schema validation
    const sql = `
      INSERT INTO "messages" ("id", "userId", "updatedAt", "folder", "messageId", "threadId", "listFields", "viewFields", "raw")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    const params: unknown[] = [
      id,
      user.value.userId,
      updatedAt,
      folder,
      mail.messageId,
      threadId,
      apiMessageResult.value.listFields,
      apiMessageResult.value.viewFields,
      rawField
    ];

    await dbQuery(sql, params);

    return makeSuccess(undefined);
  }
);
