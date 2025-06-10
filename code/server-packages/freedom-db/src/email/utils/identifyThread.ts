import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { MailMessage, MailThreadId } from 'freedom-email-api';

import { dbQuery } from '../../db/postgresClient.ts';
import type { IdentifyThreadInputMessage } from '../internal/utils/identifyThreadPureLogic.ts';
import { identifyThreadPureLogic } from '../internal/utils/identifyThreadPureLogic.ts';

export const identifyThread = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace: Trace, message: IdentifyThreadInputMessage): PR<MailThreadId | null> => {
    const threadResult = await identifyThreadPureLogic(trace, {
      message,
      findMessages: async (_trace, messageIds) => {
        const query = `
            SELECT "id", "messageId", "threadId"
            FROM "messages"
            WHERE "messageId" = ANY($1)
        `;
        const result = await dbQuery<Pick<MailMessage, 'id' | 'messageId' | 'threadId'>>(query, [messageIds]);

        return makeSuccess(result.rows);
      }
    });

    if (!threadResult.ok) {
      return threadResult;
    }

    const { threadId } = threadResult.value;

    // Handle alsoAttachMailIds if present
    if (threadResult.value.alsoAttachMailIds !== undefined && threadResult.value.alsoAttachMailIds.length > 0) {
      const updateSql = `
        UPDATE "messages"
        SET "threadId" = $1
        WHERE "id" = ANY($2)
      `;
      await dbQuery(updateSql, [threadId, threadResult.value.alsoAttachMailIds]);
    }

    return makeSuccess(threadId);
  }
);
