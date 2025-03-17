import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectOk } from 'freedom-testing-tools';

import { encryptString } from '../../encrypting/encryptString.ts';
import { generateCryptoEncryptDecryptKeySet } from '../../key-generation/generateCryptoEncryptDecryptKeySet.ts';
import { extractKeyIdFromEncryptedString } from '../extractKeyIdFromEncryptedString.ts';

describe('extractKeyIdFromEncryptedString', () => {
  it('should work', async (t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await generateCryptoEncryptDecryptKeySet(trace);
    expectOk(encryptingAndDecryptingKeys);

    const value = 'hello world';

    const encrypted = await encryptString(trace, { value, encryptingKeys: encryptingAndDecryptingKeys.value });
    expectOk(encrypted);

    const keyId = await extractKeyIdFromEncryptedString(trace, { encryptedValue: encrypted.value });
    expectOk(keyId);
    t.assert.strictEqual(keyId.value, encryptingAndDecryptingKeys.value.id);
  });
});
