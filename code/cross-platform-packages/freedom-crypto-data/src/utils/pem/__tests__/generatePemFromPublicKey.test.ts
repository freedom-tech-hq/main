import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectOk } from 'freedom-testing-tools';

import { testGenerateCryptoEncryptDecryptKeySet } from '../__test_dependency__/testGenerateCryptoEncryptDecryptKeySet.ts';
import { generatePemFromPublicKey } from '../generatePemFromPublicKey.ts';

describe('generatePemFromPublicKey', () => {
  it('should work', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await testGenerateCryptoEncryptDecryptKeySet();

    const pem = await generatePemFromPublicKey(trace, encryptingAndDecryptingKeys.rsaPublicKey);
    expectOk(pem);
  });
});
