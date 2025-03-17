import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { BaseCryptoKeySet } from 'freedom-crypto-data';
import { expectOk } from 'freedom-testing-tools';

import { generateCryptoSignVerifyKeySet } from '../generateCryptoSignVerifyKeySet.ts';

describe('generateCryptoSignVerifyKeyPair', () => {
  it('should work', async (t: TestContext) => {
    const trace = makeTrace('test');

    const signingAndVerifyingKeys = await generateCryptoSignVerifyKeySet(trace);
    expectOk(signingAndVerifyingKeys);

    t.assert.strictEqual(signingAndVerifyingKeys.value instanceof BaseCryptoKeySet, true);
  });
});
