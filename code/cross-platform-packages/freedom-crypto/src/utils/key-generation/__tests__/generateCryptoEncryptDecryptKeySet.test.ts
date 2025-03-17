import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { BaseCryptoKeySet } from 'freedom-crypto-data';
import { expectOk } from 'freedom-testing-tools';

import { generateCryptoEncryptDecryptKeySet } from '../generateCryptoEncryptDecryptKeySet.ts';

describe('generateCryptoEncryptDecryptKeyPair', () => {
  it('should work', async (t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await generateCryptoEncryptDecryptKeySet(trace);
    expectOk(encryptingAndDecryptingKeys);

    t.assert.strictEqual(encryptingAndDecryptingKeys.value instanceof BaseCryptoKeySet, true);
  });
});
