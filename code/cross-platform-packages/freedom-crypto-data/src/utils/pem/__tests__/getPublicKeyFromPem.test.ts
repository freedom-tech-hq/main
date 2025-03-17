import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectOk } from 'freedom-testing-tools';

import { asymmetricalAlgorithmByEncryptionMode } from '../../../consts/asymmetricalAlgorithmByEncryptionMode.ts';
import { testGenerateCryptoEncryptDecryptKeySet } from '../__test_dependency__/testGenerateCryptoEncryptDecryptKeySet.ts';
import { generatePemFromPublicKey } from '../generatePemFromPublicKey.ts';
import { getPublicKeyFromPem } from '../getPublicKeyFromPem.ts';

describe('getPublicKeyFromPem', () => {
  it('should work', async (t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await testGenerateCryptoEncryptDecryptKeySet();

    const pem = await generatePemFromPublicKey(trace, encryptingAndDecryptingKeys.rsaPublicKey);
    expectOk(pem);

    const publicKey = await getPublicKeyFromPem(trace, pem.value, {
      algorithm: asymmetricalAlgorithmByEncryptionMode['RSA-OAEP/4096/SHA-256'],
      usages: ['encrypt']
    });
    expectOk(publicKey);
    t.assert.deepEqual(publicKey.value, encryptingAndDecryptingKeys.rsaPublicKey);
  });
});
