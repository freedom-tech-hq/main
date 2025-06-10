import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { makeSuccess } from 'freedom-async';
import { makeIsoDateTime } from 'freedom-basic-data';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { mailIdInfo, type MailMessage, type MailThreadId } from 'freedom-email-api';

import { identifyThreadPureLogic } from '../identifyThreadPureLogic.ts';

// Such complex mail ids are overkill.
const mailId1 = mailIdInfo.make(`${makeIsoDateTime(new Date())}-${makeUuid()}`);
const mailId2 = mailIdInfo.make(`${makeIsoDateTime(new Date())}-${makeUuid()}`);

describe('identifyThreadPureLogic', () => {
  const trace = makeTrace();

  it('should return null when message has no references or inReplyTo', async () => {
    // Arrange
    const message: Pick<MailMessage, 'inReplyTo' | 'references'> = {};
    const findMessages = async () => makeSuccess<Pick<MailMessage, 'id' | 'messageId' | 'threadId'>[]>([]);

    // Act
    const result = await identifyThreadPureLogic(trace, {
      message,
      findMessages
    });

    // Assert
    assert.ok(result.ok);
    assert.strictEqual(result.value.threadId, null);
    assert.deepStrictEqual(result.value.alsoAttachMailIds, undefined);
  });

  it('should return null when no matching messages found', async () => {
    // Arrange
    const message: Pick<MailMessage, 'inReplyTo' | 'references'> = {
      references: ['the-ref1', 'the-ref2']
    };
    const findMessages = async () => makeSuccess<Pick<MailMessage, 'id' | 'messageId' | 'threadId'>[]>([]);

    // Act
    const result = await identifyThreadPureLogic(trace, {
      message,
      findMessages
    });

    // Assert
    assert.ok(result.ok);
    assert.strictEqual(result.value.threadId, null);
    assert.deepStrictEqual(result.value.alsoAttachMailIds, undefined);
  });

  it('should use existing threadId when found in related messages', async () => {
    // Arrange
    const existingThreadId = 'the-existing-thread-id' as MailThreadId;
    const message: Pick<MailMessage, 'inReplyTo' | 'references'> = {
      inReplyTo: 'the-reply-to-id'
    };
    const findMessages = async () =>
      makeSuccess<Pick<MailMessage, 'id' | 'messageId' | 'threadId'>[]>([
        { id: mailId1, messageId: 'the-reply-to-id', threadId: existingThreadId }
      ]);

    // Act
    const result = await identifyThreadPureLogic(trace, {
      message,
      findMessages
    });

    // Assert
    assert.ok(result.ok);
    assert.strictEqual(result.value.threadId, existingThreadId);
    assert.deepStrictEqual(result.value.alsoAttachMailIds, undefined);
  });

  it('should create new threadId when related messages have no threadId', async () => {
    // Arrange
    const message: Pick<MailMessage, 'inReplyTo' | 'references'> = {
      references: ['the-ref1', 'the-ref2']
    };

    const findMessages = async () =>
      makeSuccess<Pick<MailMessage, 'id' | 'messageId' | 'threadId'>[]>([
        { id: mailId1, messageId: 'the-ref1', threadId: null },
        { id: mailId2, messageId: 'the-ref2', threadId: null }
      ]);

    // Act
    const result = await identifyThreadPureLogic(trace, {
      message,
      findMessages
    });

    // Assert
    assert.ok(result.ok);
    assert.notStrictEqual(result.value.threadId, null);
    assert.deepStrictEqual(result.value.alsoAttachMailIds, [mailId1, mailId2]);
  });
});
