import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { MailMessage, MailThreadId } from 'freedom-email-api';

import { dbQuery } from '../../db/postgresClient.ts';

export type IdentifyThreadInputMessage = Pick<MailMessage, 'inReplyTo' | 'references'>;

export const identifyThread = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace: Trace, message: IdentifyThreadInputMessage): PR<MailThreadId | null> => {
    const idsToCheck: string[] = [];

    if (message.inReplyTo !== undefined) {
      idsToCheck.push(message.inReplyTo);
    }

    if (message.references !== undefined) {
      idsToCheck.push(...message.references);
    }

    // If no IDs to check, return null (no thread)
    if (idsToCheck.length === 0) {
      return makeSuccess(null);
    }

    // Find messages with the given IDs
    const query = `
      SELECT "id", "messageId", "threadId"
      FROM "messages"
      WHERE "messageId" = ANY($1)
    `;
    const messagesResult = await dbQuery<Pick<MailMessage, 'id' | 'messageId' | 'threadId'>>(query, [idsToCheck]);

    const messages = messagesResult.rows;

    // The messageIds are not in our database
    if (messages.length === 0) {
      return makeSuccess(null);
    }

    // Prioritize inReplyTo over references
    const inReplyToMessage =
      message.inReplyTo !== undefined
        ? messages.find((msg) => msg.messageId === message.inReplyTo) // prettier-fix
        : undefined;

    return makeSuccess<MailThreadId>(inReplyToMessage !== undefined ? inReplyToMessage.threadId : messages[0].threadId);
  }
);
