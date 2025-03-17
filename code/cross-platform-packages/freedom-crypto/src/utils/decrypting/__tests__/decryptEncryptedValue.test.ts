import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { base64String } from 'freedom-basic-data';
import { makeTrace } from 'freedom-contexts';
import { expectNotOk, expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { generateEncryptedValue } from '../../encrypting/generateEncryptedValue.ts';
import { generateCryptoEncryptDecryptKeySet } from '../../key-generation/generateCryptoEncryptDecryptKeySet.ts';
import { decryptEncryptedValue } from '../decryptEncryptedValue.ts';

describe('decryptEncryptedValue', () => {
  it('should return decrypted value on success', async (t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await generateCryptoEncryptDecryptKeySet(trace);
    expectOk(encryptingAndDecryptingKeys);

    const value = { one: 3.14, two: 'hello world' };
    const valueSchema = schema.object({
      one: schema.number(),
      two: schema.string()
    });

    const encryptedValue = await generateEncryptedValue(trace, { value, valueSchema, encryptingKeys: encryptingAndDecryptingKeys.value });
    expectOk(encryptedValue);

    const decrypted = await decryptEncryptedValue(trace, encryptedValue.value, { decryptingKeys: encryptingAndDecryptingKeys.value });
    expectOk(decrypted);
    t.assert.deepStrictEqual(decrypted.value, value);
  });

  it("should return failure if encryption isn't valid", async (_t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await generateCryptoEncryptDecryptKeySet(trace);
    expectOk(encryptingAndDecryptingKeys);

    const value = { one: 3.14, two: 'hello world' };
    const valueSchema = schema.object({
      one: schema.number(),
      two: schema.string()
    });

    const encryptedValue = await generateEncryptedValue(trace, { value, valueSchema, encryptingKeys: encryptingAndDecryptingKeys.value });
    expectOk(encryptedValue);

    encryptedValue.value.encryptedValue = base64String.makeWithUtf8String('INVALID');

    const decrypted = await decryptEncryptedValue(trace, encryptedValue.value, { decryptingKeys: encryptingAndDecryptingKeys.value });
    expectNotOk(decrypted);
  });
});
