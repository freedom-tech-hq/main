import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { getStringFixture } from 'freedom-testing-tools';
import type { User } from '../../../../types/User.ts';

const publicKey = getStringFixture(
  import.meta.dirname,
  '../../../../__tests__/fixtures/crypto-stub/user1_public.asc'
);
const user: User = {
  email: 'user1@my-test.com',
  publicKey
};

describe('processEmail', async () => {
  // Mock dependencies
  const findUsersMock = mock.fn(async () => [user]);
  mock.module('../../../storage/utils/findUsers.ts', {
    namedExports: {
      findUsers: findUsersMock
    }
  });

  const saveToStorageInboxMock = mock.fn();
  mock.module('../../../storage/utils/saveToStorageInbox.ts', {
    namedExports: {
      saveToStorageInbox: saveToStorageInboxMock
    }
  });

  // Load the subject under test after mocking dependencies
  const { processEmail } = await import('../processEmail.ts');

  it('handles a typical case', async () => {
    // Arrange
    const inEmail = getStringFixture(
      import.meta.dirname,
      '../../../../__tests__/fixtures/sample.eml'
    );

    // Act
    await processEmail(inEmail);

    // Assert
    // Check saveToStorageInbox was called for each part
    const calls = saveToStorageInboxMock.mock.calls;
    assert.strictEqual(calls.length, 3, 'saveToStorageInbox should be called 3 times (render, archive, body)');

    // Check that each call has the correct user
    for (const call of calls) {
      const [calledUser, part] = call.arguments;
      assert.strictEqual(calledUser, user, 'saveToStorageInbox should be called with the correct user');
      assert.ok(part.filename, 'Each part should have a filename');
      assert.ok(part.payload, 'Each part should have a payload');
    }

    // Verify we have all required parts
    const filenames = calls.map(call => call.arguments[1].filename);
    assert.ok(filenames.some(f => f.endsWith('.email')), 'Should have a render part with .email extension');
    assert.ok(filenames.length === new Set(filenames).size, 'All filenames should be unique');
  });

  it('processes email with multiple recipients', async () => {
    // Arrange
    // Create test email with multiple recipients
    const multiRecipientEmail = `From: sender@my-test.com
To: user1@my-test.com, user2@my-test.com
Cc: user3@my-test.com
Subject: Email with multiple recipients
Date: Thu, 20 Mar 2025 20:28:34 +0100
Message-Id: <20250320202834.004250@test.local>

This is a test email with multiple recipients`;

    // Reset mocks for this test
    findUsersMock.mock.resetCalls();
    saveToStorageInboxMock.mock.resetCalls();

    // Setup findUsersMock to return multiple users
    const testUsers = [
      user,
      { email: 'user2@my-test.com', publicKey },
      { email: 'user3@my-test.com', publicKey }
    ];
    findUsersMock.mock.mockImplementation(async () => testUsers);

    // Act
    await processEmail(multiRecipientEmail);

    // Assert
    assert.strictEqual(findUsersMock.mock.calls.length, 1, 'findUsers should be called once');

    // Each user should have 3 parts saved (render, archive, body)
    const minExpectedCalls = testUsers.length * 3;
    assert.strictEqual(
      saveToStorageInboxMock.mock.calls.length,
      testUsers.length * 3,
      `saveToStorageInbox should be called at least ${minExpectedCalls} times (3 parts per user)`
    );

    // Check that each user got their parts
    const userEmailsWithParts = new Set(
      saveToStorageInboxMock.mock.calls.map(call => call.arguments[0].email)
    );
    assert.strictEqual(userEmailsWithParts.size, testUsers.length, 'Each user should receive parts');
    for (const user of testUsers) {
      assert.ok(userEmailsWithParts.has(user.email), `${user.email} should receive parts`);
    }
  });

  it('handles empty recipients gracefully', async () => {
    // Arrange
    // Create test email with no valid recipients
    const noRecipientsEmail = `From: sender@my-test.com
Subject: Email with no recipients
Date: Thu, 20 Mar 2025 20:28:34 +0100
Message-Id: <20250320202834.004250@test.local>

This is a test email with no recipients`;

    // Reset mocks for this test
    findUsersMock.mock.resetCalls();
    saveToStorageInboxMock.mock.resetCalls();

    // Setup findUsersMock to return empty array
    findUsersMock.mock.mockImplementation(async () => []);

    // Act
    await processEmail(noRecipientsEmail);

    // Assert
    assert.strictEqual(findUsersMock.mock.calls.length, 0, 'findUsers should not be called');
    assert.strictEqual(saveToStorageInboxMock.mock.calls.length, 0, 'saveToStorageInbox should not be called when no recipients');
  });
});
