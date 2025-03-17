import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { preferredEncryptionMode } from 'freedom-crypto-data';
import { expectOk } from 'freedom-testing-tools';

import { generateCryptoEncryptDecryptKeySet } from '../../key-generation/generateCryptoEncryptDecryptKeySet.ts';
import { encryptString } from '../encryptString.ts';

describe('encryptString', () => {
  it('should work with short strings', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await generateCryptoEncryptDecryptKeySet(trace);
    expectOk(encryptingAndDecryptingKeys);

    const value = 'hello world';

    const encrypted = await encryptString(trace, {
      mode: preferredEncryptionMode,
      value,
      encryptingKeys: encryptingAndDecryptingKeys.value
    });
    expectOk(encrypted);
  });

  it('should work with includeKeyId=false', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await generateCryptoEncryptDecryptKeySet(trace);
    expectOk(encryptingAndDecryptingKeys);

    const value = 'hello world';

    const encrypted = await encryptString(trace, {
      mode: preferredEncryptionMode,
      value,
      encryptingKeys: encryptingAndDecryptingKeys.value,
      includeKeyId: false
    });
    expectOk(encrypted);
  });

  it('should work with long strings', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await generateCryptoEncryptDecryptKeySet(trace);
    expectOk(encryptingAndDecryptingKeys);

    const value = new Array(100000).fill('hello world').join(',');

    const encrypted = await encryptString(trace, {
      mode: preferredEncryptionMode,
      value,
      encryptingKeys: encryptingAndDecryptingKeys.value
    });
    expectOk(encrypted);
  });
});
