import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectOk } from 'freedom-testing-tools';

import { testGenerateCryptoEncryptDecryptKeySet } from '../__test_dependency__/testGenerateCryptoEncryptDecryptKeySet.ts';
import { generatePemFromPrivateKey } from '../generatePemFromPrivateKey.ts';

describe('generatePemFromPrivateKey', () => {
  it('should work', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await testGenerateCryptoEncryptDecryptKeySet();

    const pem = await generatePemFromPrivateKey(trace, encryptingAndDecryptingKeys.rsaPrivateKey, 'pkcs8');
    expectOk(pem);
  });
});
