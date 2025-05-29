import assert from 'node:assert';
import { after, describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { invalidateAllInMemoryCaches } from 'freedom-in-memory-cache';
import { getSerializedFixture } from 'freedom-testing-tools';

import { initConfigForTests } from '../../../config.ts';
import { closePostgres } from '../../../db/postgresClient.ts';
import { testsResetDb } from '../../../tests/testsResetDb.ts';
import type { User } from '../../types/User.ts';
import { addUser } from '../addUser.ts';

async function getTestKeys() {
  // Load the private key set fixture and extract public keys
  // TODO: consider introducing a package `test-assets`
  const privateKeys = await getSerializedFixture(
    import.meta.dirname,
    '../../../../../../cross-platform-packages/freedom-syncable-store/src/tests/fixtures/keys.json',
    privateCombinationCryptoKeySetSchema
  );
  return privateKeys.publicOnly();
}

after(async () => {
  invalidateAllInMemoryCaches();
  await closePostgres();
});

describe('addUser', () => {
  it('handles a typical case', async () => {
    // Arrange
    initConfigForTests({});
    await testsResetDb();
    const user: User = {
      userId: 'EMAILUSER_the-id',
      email: 'typical@example.com',
      publicKeys: await getTestKeys(),
      defaultSalt: 'the-salt'
    };
    const trace = makeTrace();

    // Act
    const result = await addUser(trace, user);

    // Assert
    assert.ok(result.ok, 'Should successfully add user');
    assert.deepStrictEqual(result.value, user);

    // Act - exact duplicate
    const result2 = await addUser(trace, user);

    // Assert
    assert.ok(!result2.ok, 'Should fail for exact duplicate');
    assert.strictEqual(result2.value?.errorCode, 'already-created');
  });

  it('should not allow duplicate userId with different email', async () => {
    // Arrange
    initConfigForTests({});
    await testsResetDb();
    const trace = makeTrace();
    const user1: User = {
      userId: 'EMAILUSER_dup-id',
      email: 'first@example.com',
      publicKeys: await getTestKeys(),
      defaultSalt: 'salt-1'
    };
    const user2: User = {
      userId: 'EMAILUSER_dup-id',
      email: 'second@example.com',
      publicKeys: await getTestKeys(),
      defaultSalt: 'salt-2'
    };
    await addUser(trace, user1);

    // Act
    const result = await addUser(trace, user2);

    // Assert
    assert.ok(!result.ok, 'Should fail for duplicate userId with different email');
    assert.strictEqual(result.value?.errorCode, 'conflict');
  });

  it('should not allow duplicate email for different userId', async () => {
    // Arrange
    initConfigForTests({});
    await testsResetDb();
    const trace = makeTrace();
    const user1: User = {
      userId: 'EMAILUSER_id1',
      email: 'same@example.com',
      publicKeys: await getTestKeys(),
      defaultSalt: 'salt-1'
    };
    const user2: User = {
      userId: 'EMAILUSER_id2',
      email: 'same@example.com',
      publicKeys: await getTestKeys(),
      defaultSalt: 'salt-2'
    };
    await addUser(trace, user1);

    // Act
    const result = await addUser(trace, user2);

    // Assert
    assert.ok(!result.ok, 'Should fail for duplicate email with different userId');
    assert.strictEqual(result.value?.errorCode, 'email-unavailable');
  });

  it('returns failure if schema is violated', async () => {
    // Arrange
    initConfigForTests({});
    await testsResetDb();
    const trace = makeTrace();
    const user: User = {
      userId: 'EMAILUSER_missing',
      email: 'missing@example.com',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      publicKeys: null as any,
      defaultSalt: 'the-salt'
    };

    // Act
    const result = await addUser(trace, user);

    // Assert
    assert.ok(!result.ok, 'Should fail for schema violation');
    assert.strictEqual(result.value?.errorCode, 'generic');
  });
});
