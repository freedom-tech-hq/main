import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';

import { makeIsoDateTime } from 'freedom-basic-data';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { emailUserIdInfo, mailIdInfo, type MailMessage, mailThreadIdInfo } from 'freedom-email-api';
import { invalidateAllInMemoryCaches } from 'freedom-in-memory-cache';

import { initConfigForTests } from '../../../config.ts';
import { closePostgres, dbQuery } from '../../../db/postgresClient.ts';
import { testsResetDb } from '../../../tests/testsResetDb.ts';
import { identifyThread } from '../identifyThread.ts';

// Such complex mail ids are overkill.
const mailId1 = mailIdInfo.make(`${makeIsoDateTime(new Date())}-${makeUuid()}`);
const mailId2 = mailIdInfo.make(`${makeIsoDateTime(new Date())}-${makeUuid()}`);
const threadId1 = mailThreadIdInfo.make(makeUuid());
const threadId2 = mailThreadIdInfo.make(makeUuid());
const userId = emailUserIdInfo.make('the-user');

/**
 * Helper function to insert a test message with all required fields
 */
async function insertTestMessage(id: string, messageId: string, threadId: string): Promise<void> {
  await dbQuery(
    `INSERT INTO "messages" (
      "id", "messageId", "threadId",
      "listFields", "viewFields", "folder", "updatedAt", "userId"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      messageId,
      threadId,
      '', // listFields
      '', // viewFields
      'inbox', // folder
      new Date().toISOString(), // updatedAt
      userId // userId
    ]
  );
}

/**
 * Helper function to insert a test user with only userId populated
 */
async function insertTestUser(): Promise<void> {
  await dbQuery(
    `INSERT INTO "users" (
      "userId", "email", "publicKeys", "encryptedCredentials"
    ) VALUES ($1, $2, $3, $4)`,
    [
      userId,
      '', // email
      '{}', // publicKeys (empty JSON object)
      null // encryptedCredential
    ]
  );
}

after(async () => {
  invalidateAllInMemoryCaches();
  await closePostgres();
});

describe('identifyThread', () => {
  const trace = makeTrace();

  it('should return null when message has no references or inReplyTo', async () => {
    // Arrange
    initConfigForTests({});
    await testsResetDb();
    const message: Pick<MailMessage, 'inReplyTo' | 'references'> = {};

    // Act
    const result = await identifyThread(trace, message);

    // Assert
    assert.ok(result.ok);
    assert.strictEqual(result.value, null);
  });

  it('should return null when no matching messages found', async () => {
    // Arrange
    initConfigForTests({});
    await testsResetDb();
    const message: Pick<MailMessage, 'inReplyTo' | 'references'> = {
      references: ['the-ref1', 'the-ref2']
    };

    // Act
    const result = await identifyThread(trace, message);

    // Assert
    assert.ok(result.ok);
    assert.strictEqual(result.value, null);
  });

  it('should prefer threadId of inReplyTo over threadId of references', async () => {
    // Arrange
    initConfigForTests({});
    await testsResetDb();

    const replyToThreadId = threadId1;
    const message: Pick<MailMessage, 'inReplyTo' | 'references'> = {
      inReplyTo: 'the-reply-to-id',
      references: ['the-ref1', 'the-ref2']
    };

    await insertTestUser();
    await insertTestMessage(mailId1, 'the-ref1', threadId2);
    await insertTestMessage(mailId2, 'the-reply-to-id', replyToThreadId);

    // Act
    const result = await identifyThread(trace, message);

    // Assert
    assert.ok(result.ok);
    assert.strictEqual(result.value, replyToThreadId);
  });

  it('should use existing threadId when found in related messages', async () => {
    // Arrange
    initConfigForTests({});
    await testsResetDb();

    const existingThreadId = threadId1;
    const message: Pick<MailMessage, 'inReplyTo' | 'references'> = {
      references: ['the-ref1', 'the-ref2']
    };

    await insertTestUser();
    await insertTestMessage(mailId1, 'the-ref1', existingThreadId);
    await insertTestMessage(mailId2, 'the-ref2', existingThreadId);

    // Act
    const result = await identifyThread(trace, message);

    // Assert
    assert.ok(result.ok);
    assert.strictEqual(result.value, existingThreadId);
  });
});
