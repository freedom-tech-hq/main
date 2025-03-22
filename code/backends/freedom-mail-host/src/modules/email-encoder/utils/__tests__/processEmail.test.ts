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
    // Check saveToStorageInbox was called with correct parameters
    assert.strictEqual(saveToStorageInboxMock.mock.calls.length, 1, 'saveToStorageInbox should be called once');

    const [calledUser, calledEmail] = saveToStorageInboxMock.mock.calls[0].arguments;
    assert.strictEqual(calledUser, user, 'saveToStorageInbox should be called with the correct user');
    assert.deepStrictEqual(calledEmail.metadata, {
      contentType: 'application/pgp-encrypted',
      date: '2025-03-20T19:28:34.000Z',
      from: 'sender@my-test.com',
      headers: '{}',
      messageId: '20250320202834.004250@pavel-mac2.local',
      subject: 'test Thu, 20 Mar 2025 20:28:34 +0100',
      timestamp: calledEmail.metadata.timestamp, // Use dynamic timestamp instead of hardcoded value
      to: 'user1@my-test.com'
    });
    assert.ok(calledEmail.body, 'Encrypted email should have a body');
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
    assert.strictEqual(saveToStorageInboxMock.mock.calls.length, 3, 'saveToStorageInbox should be called for each user');

    // Check that saveToStorageInbox was called with each user
    const recipientEmails = saveToStorageInboxMock.mock.calls.map(call => call.arguments[0].email);
    assert.ok(recipientEmails.includes('user1@my-test.com'), 'user1 should receive email');
    assert.ok(recipientEmails.includes('user2@my-test.com'), 'user2 should receive email');
    assert.ok(recipientEmails.includes('user3@my-test.com'), 'user3 should receive email');
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
