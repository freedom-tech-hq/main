import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';

import { makeIsoDateTime } from 'freedom-basic-data';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { emailUserIdInfo, mailIdInfo, type MailMessage, type MailThreadId } from 'freedom-email-api';
import { invalidateAllInMemoryCaches } from 'freedom-in-memory-cache';

import { initConfigForTests } from '../../../config.ts';
import { closePostgres, dbQuery } from '../../../db/postgresClient.ts';
import { testsResetDb } from '../../../tests/testsResetDb.ts';
import { identifyThread } from '../identifyThread.ts';

// Such complex mail ids are overkill.
const mailId1 = mailIdInfo.make(`${makeIsoDateTime(new Date())}-${makeUuid()}`);
const mailId2 = mailIdInfo.make(`${makeIsoDateTime(new Date())}-${makeUuid()}`);
const userId = emailUserIdInfo.make('the-user');

/**
 * Helper function to insert a test message with all required fields
 */
async function insertTestMessage(id: string, messageId: string, threadId: string | null): Promise<void> {
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

  it('should use existing threadId when found in related messages', async () => {
    // Arrange
    initConfigForTests({});
    await testsResetDb();

    const existingThreadId = 'the-existing-thread-id' as MailThreadId;
    const message: Pick<MailMessage, 'inReplyTo' | 'references'> = {
      inReplyTo: 'the-reply-to-id'
    };

    // Insert a message with the existing threadId
    await insertTestUser();
    await insertTestMessage(mailId1, 'the-reply-to-id', existingThreadId);

    // Act
    const result = await identifyThread(trace, message);

    // Assert
    assert.ok(result.ok);
    assert.strictEqual(result.value, existingThreadId);
  });

  it('should create new threadId when related messages have no threadId', async () => {
    // Arrange
    initConfigForTests({});
    await testsResetDb();

    const message: Pick<MailMessage, 'inReplyTo' | 'references'> = {
      references: ['the-ref1', 'the-ref2']
    };

    // Insert messages with null threadId
    await insertTestUser();
    await insertTestMessage(mailId1, 'the-ref1', null);
    await insertTestMessage(mailId2, 'the-ref2', null);

    // Act
    const result = await identifyThread(trace, message);

    // Assert
    assert.ok(result.ok);
    assert.notStrictEqual(result.value, null);

    // Check that the related messages have been updated with the new threadId
    const updatedMessages = await dbQuery<Pick<MailMessage, 'id' | 'threadId'>>(
      `SELECT "id", "threadId" FROM "messages" WHERE "id" = ANY($1)`,
      [[mailId1, mailId2]]
    );

    assert.strictEqual(updatedMessages.rows.length, 2);
    assert.strictEqual(updatedMessages.rows[0].threadId, result.value);
    assert.strictEqual(updatedMessages.rows[1].threadId, result.value);
  });
});
