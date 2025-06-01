import { describe, it } from 'node:test';

import { expect } from 'expect';
import { makeTrace } from 'freedom-contexts';
import { encryptValue } from 'freedom-crypto';
import { privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { expectOk, getSerializedFixture } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { makeUserKeysForTesting } from '../../tests/makeUserKeysForTesting.ts';
import { userDecryptValue } from '../userDecryptValue.ts';

const testSchema = schema.object({
  theField: schema.string()
});

describe('encrypt-decrypt', () => {
  const trace = makeTrace();

  it('handles typical case', async () => {
    // Arrange
    const privateKeys = await getSerializedFixture(
      import.meta.dirname,
      // TODO: Move the fixture closer to privateCombinationCryptoKeySetSchema
      //  also see getPrivateKeysFixture()
      '../../../../freedom-syncable-store/src/tests/fixtures/keys.json',
      privateCombinationCryptoKeySetSchema
    );
    const publicKeys = privateKeys.publicOnly();
    const userKeys = makeUserKeysForTesting({ privateKeys });

    const originalValue = {
      theField: 'the-value'
    };

    // Act - Encrypt
    const encryptedResult = await encryptValue(trace, {
      valueSchema: testSchema,
      value: originalValue,
      encryptingKeys: publicKeys
    });

    // Assert
    expectOk(encryptedResult);
    expect(encryptedResult.value).toMatch(/^B64_/);

    // Act - Decrypt with private keys
    const decryptedResult = await userDecryptValue(trace, {
      schema: testSchema,
      encryptedValue: encryptedResult.value,
      userKeys
    });

    // Assert
    expectOk(decryptedResult);
    expect(decryptedResult.value).toStrictEqual(originalValue);

    // TODO: Implement this.
    //  It is impossible with TypeScript,
    //  but we should still ensure that we occasionally haven't used a method where the public key decrypts
    // Act - Fail to decrypt with public keys
    // const result = await decryptValue(trace, {
    //   encryptedValue: encryptedResult.value,
    //   valueSchema: testSchema,
    //   decryptingKeys: publicKeys
    // });
  });
});
