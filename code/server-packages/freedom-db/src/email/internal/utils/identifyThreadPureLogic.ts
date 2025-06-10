import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';
import { type MailId, type MailMessage, type MailThreadId, mailThreadIdInfo } from 'freedom-email-api';

export type IdentifyThreadInputMessage = Pick<MailMessage, 'inReplyTo' | 'references'>;

export type IdentifyThreadResult = {
  threadId: MailThreadId | null;
  alsoAttachMailIds?: MailId[];
};

// This includes external message ids, they are not strict
type AnyMessageId = string;

export const identifyThreadPureLogic = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      message,
      findMessages
    }: {
      message: IdentifyThreadInputMessage;
      findMessages: (trace: Trace, messageIds: AnyMessageId[]) => PR<Pick<MailMessage, 'id' | 'messageId' | 'threadId'>[]>;
    }
  ): PR<IdentifyThreadResult> => {
    const idsToCheck: string[] = [];

    if (message.inReplyTo !== undefined) {
      idsToCheck.push(message.inReplyTo);
    }

    if (message.references !== undefined) {
      idsToCheck.push(...message.references);
    }

    // If no IDs to check, return null (no thread)
    if (idsToCheck.length === 0) {
      return makeSuccess<IdentifyThreadResult>({
        threadId: null
      });
    }

    // Find messages with the given IDs
    const messagesResult = await findMessages(trace, idsToCheck);
    if (!messagesResult.ok) {
      return messagesResult;
    }

    const messages = messagesResult.value;

    // The messageIds are not in our database
    if (messages.length === 0) {
      return makeSuccess<IdentifyThreadResult>({
        threadId: null
      });
    }

    const inReplyToMessage =
      message.inReplyTo !== undefined
        ? messages.find((msg) => msg.messageId === message.inReplyTo) // prettier-fix
        : undefined;

    // Find a message with a threadId
    const messageWithThread =
      (inReplyToMessage?.threadId ?? null) !== null
        ? inReplyToMessage // prettier-fix
        : messages.find((msg) => msg.threadId !== null);

    // There's a thread
    if (messageWithThread !== undefined) {
      // Link the inReplyTo message to the same thread, if not yet
      if (inReplyToMessage !== undefined && inReplyToMessage.threadId === null) {
        return makeSuccess<IdentifyThreadResult>({
          threadId: messageWithThread.threadId,
          alsoAttachMailIds: [inReplyToMessage.id]
        });
      }

      return makeSuccess<IdentifyThreadResult>({
        threadId: messageWithThread.threadId
      });
    }

    // Found related messages but no thread ID, create a new thread for all messages
    // TODO: Consider fetching a piece of id from the first message id
    const newThreadId = mailThreadIdInfo.make(makeUuid());

    return makeSuccess<IdentifyThreadResult>({
      threadId: newThreadId,
      alsoAttachMailIds: messages.map((msg) => msg.id)
    });
  }
);
