import { describe, it } from 'node:test';
import assert from 'node:assert';
import { encryptEmail } from '../encryptEmail.ts';
import { decryptFile } from '../decryptFile.ts';
import { getJsFixture, getStringFixture } from 'freedom-testing-tools';
import type { User } from '../../../../types/User.ts';
import * as openpgp from 'openpgp';

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
const receivedAt = '2023-01-01T00:00:00Z';

describe('encryptEmail', () => {
  it('handles a typical case', async () => {
    // Arrange
    const parsedEmail = await getJsFixture(
      import.meta.dirname,
      '../../../../__tests__/fixtures/sample-parsed.mjs'
    );

    // Act
    const encryptedEmail = await encryptEmail({ user, parsedEmail, receivedAt });

    // Assert structure
    assert.ok(encryptedEmail.render.filename.endsWith('.email'), 'Render filename should end with .email');
    assert.ok(encryptedEmail.body.filename, 'Body should have a filename');
    assert.ok(encryptedEmail.archive.filename, 'Archive should have a filename');
    assert.strictEqual(encryptedEmail.attachments.length, parsedEmail.attachments.length, 'Should have same number of attachments');

    // Prepare private key
    const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
    const decryptedPrivateKey = await openpgp.decryptKey({
      privateKey,
      passphrase: 'testpassword'
    });

    // Decrypt and verify render section
    const decryptedRender = JSON.parse(await decryptFile(encryptedEmail.render.payload, decryptedPrivateKey));
    assert.deepStrictEqual(decryptedRender, {
      ...parsedEmail.render,
      receivedAt,
      bodyId: encryptedEmail.body.filename
    });

    // Decrypt and verify body section
    const decryptedBody = JSON.parse(await decryptFile(encryptedEmail.body.payload, decryptedPrivateKey));
    assert.deepStrictEqual(decryptedBody, {
      body: parsedEmail.body,
      htmlBody: parsedEmail.htmlBody,
      attachments: encryptedEmail.attachments.map(a => ({
        ...parsedEmail.attachments[0].render,
        contentId: a.filename
      })),
      archiveId: encryptedEmail.archive.filename
    });

    // Decrypt and verify attachments
    for (let i = 0; i < encryptedEmail.attachments.length; i++) {
      const decryptedAttachment = Buffer.from(
        await decryptFile(encryptedEmail.attachments[i].payload, decryptedPrivateKey)
      );
      assert.deepStrictEqual(
        decryptedAttachment,
        parsedEmail.attachments[i].content,
        `Attachment ${i} content should match`
      );
    }
  });
});
