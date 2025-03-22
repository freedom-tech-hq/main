import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as openpgp from 'openpgp';
import { encryptEmail } from '../encryptEmail.ts';
import { getJsFixture, getStringFixture } from 'freedom-testing-tools';
import type { User } from '../../../../types/User.ts';

const publicKey = getStringFixture(
  import.meta.dirname,
  '../../../../__tests__/fixtures/crypto-stub/user1_public.asc'
);
const privateKeyArmored = getStringFixture(
  import.meta.dirname,
  '../../../../__tests__/fixtures/crypto-stub/user1_private.asc'
);
const user: User = {
  email: 'user1@my-test.com',
  publicKey
};

describe('encryptEmail', () => {
  it('handles a typical case', async () => {
    // Arrange
    const parsedEmail = await getJsFixture(
      import.meta.dirname,
      '../../../../__tests__/fixtures/sample-parsed.mjs'
    );

    // Act
    const encryptedEmail = await encryptEmail(user, parsedEmail);

    // Assert
    const { body, metadata } = encryptedEmail;

    assert.deepStrictEqual(metadata, {
      contentType: 'application/pgp-encrypted',
      date: '2025-03-20T19:28:34.000Z',
      from: 'sender@my-test.com',
      headers: '{}',
      messageId: '20250320202834.004250@pavel-mac2.local',
      subject: 'test Thu, 20 Mar 2025 20:28:34 +0100',
      timestamp: metadata.timestamp, // Use dynamic timestamp instead of hardcoded value
      to: 'user1@my-test.com'
    });

    // Decrypt and verify the message
    // Load private key
    const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
    const decryptedPrivateKey = await openpgp.decryptKey({
      privateKey,
      passphrase: 'testpassword'
    });

    // Decrypt the message
    const encryptedBody = await openpgp.readMessage({
      armoredMessage: body
    });
    const { data: decrypted } = await openpgp.decrypt({
      message: encryptedBody,
      decryptionKeys: decryptedPrivateKey
    });

    // Verify
    assert.strictEqual(decrypted, parsedEmail.text);
  });
});
