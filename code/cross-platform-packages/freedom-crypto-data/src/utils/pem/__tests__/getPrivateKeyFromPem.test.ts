import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectOk } from 'freedom-testing-tools';

import { asymmetricalAlgorithmByEncryptionMode } from '../../../consts/asymmetricalAlgorithmByEncryptionMode.ts';
import { testGenerateCryptoEncryptDecryptKeySet } from '../__test_dependency__/testGenerateCryptoEncryptDecryptKeySet.ts';
import { generatePemFromPrivateKey } from '../generatePemFromPrivateKey.ts';
import { getPrivateKeyFromPem } from '../getPrivateKeyFromPem.ts';

describe('getPrivateKeyFromPem', () => {
  it('should work', async (t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await testGenerateCryptoEncryptDecryptKeySet();

    const pem = await generatePemFromPrivateKey(trace, encryptingAndDecryptingKeys.rsaPrivateKey, 'pkcs8');
    expectOk(pem);

    const privateKey = await getPrivateKeyFromPem(trace, pem.value, 'pkcs8', {
      algorithm: asymmetricalAlgorithmByEncryptionMode['RSA-OAEP/4096/SHA-256'],
      usages: ['decrypt']
    });
    expectOk(privateKey);
    t.assert.deepEqual(privateKey.value, encryptingAndDecryptingKeys.rsaPrivateKey);
  });
});
