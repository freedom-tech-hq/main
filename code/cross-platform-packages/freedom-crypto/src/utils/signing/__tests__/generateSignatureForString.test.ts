import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectOk } from 'freedom-testing-tools';

import { generateCryptoSignVerifyKeySet } from '../../key-generation/generateCryptoSignVerifyKeySet.ts';
import { generateSignatureForString } from '../generateSignatureForString.ts';

describe('generateSignatureForString', () => {
  it('should work', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const signingAndVerifyingKeys = await generateCryptoSignVerifyKeySet(trace);
    expectOk(signingAndVerifyingKeys);

    const value = 'hello world';

    const signature = await generateSignatureForString(trace, { value, signingKeys: signingAndVerifyingKeys.value });
    expectOk(signature);
  });
});
