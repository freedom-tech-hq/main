import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { base64String } from 'freedom-basic-data';
import { makeTrace } from 'freedom-contexts';
import { expectNotOk, expectOk } from 'freedom-testing-tools';

import { encryptString } from '../../encrypting/encryptString.ts';
import { generateCryptoEncryptDecryptKeySet } from '../../key-generation/generateCryptoEncryptDecryptKeySet.ts';
import { decryptString } from '../decryptString.ts';

describe('decryptString', () => {
  it('should return decrypted value on success, with short string', async (t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await generateCryptoEncryptDecryptKeySet(trace);
    expectOk(encryptingAndDecryptingKeys);

    const value = 'hello world';

    const encrypted = await encryptString(trace, { value, encryptingKeys: encryptingAndDecryptingKeys.value });
    expectOk(encrypted);

    const decrypted = await decryptString(trace, {
      encryptedValue: encrypted.value,
      decryptingKeys: encryptingAndDecryptingKeys.value
    });
    expectOk(decrypted);
    t.assert.strictEqual(decrypted.value, value);
  });

  it('should return decrypted value on success, with long string', async (t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await generateCryptoEncryptDecryptKeySet(trace);
    expectOk(encryptingAndDecryptingKeys);

    const value = new Array(100000).fill('hello world').join(',');

    const encrypted = await encryptString(trace, { value, encryptingKeys: encryptingAndDecryptingKeys.value });
    expectOk(encrypted);

    const decrypted = await decryptString(trace, {
      encryptedValue: encrypted.value,
      decryptingKeys: encryptingAndDecryptingKeys.value
    });
    expectOk(decrypted);
    t.assert.strictEqual(decrypted.value, value);
  });

  it("should return failure if encryption isn't valid", async (_t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await generateCryptoEncryptDecryptKeySet(trace);
    expectOk(encryptingAndDecryptingKeys);

    const decrypted = await decryptString(trace, {
      encryptedValue: base64String.makeWithUtf8String('INVALID'),
      decryptingKeys: encryptingAndDecryptingKeys.value
    });
    expectNotOk(decrypted);
  });
});
