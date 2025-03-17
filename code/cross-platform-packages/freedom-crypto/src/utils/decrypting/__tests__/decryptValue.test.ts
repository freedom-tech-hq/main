import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { base64String } from 'freedom-basic-data';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import { makeTrace } from 'freedom-contexts';
import { expectNotOk, expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { encryptValue } from '../../encrypting/encryptValue.ts';
import { generateCryptoEncryptDecryptKeySet } from '../../key-generation/generateCryptoEncryptDecryptKeySet.ts';
import { decryptValue } from '../decryptValue.ts';

describe('decryptValue', () => {
  it('should return decrypted value on success', async (t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await generateCryptoEncryptDecryptKeySet(trace);
    expectOk(encryptingAndDecryptingKeys);

    const value = { one: 3.14, two: 'hello world' };
    const valueSchema = schema.object({
      one: schema.number(),
      two: schema.string()
    });

    const encrypted = await encryptValue(trace, { value, valueSchema, encryptingKeys: encryptingAndDecryptingKeys.value });
    expectOk(encrypted);

    const decrypted = await decryptValue(trace, {
      encryptedValue: encrypted.value,
      valueSchema,
      decryptingKeys: encryptingAndDecryptingKeys.value
    });
    expectOk(decrypted);
    t.assert.deepStrictEqual(decrypted.value, value);
  });

  it("should return failure if encryption isn't valid", async (_t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await generateCryptoEncryptDecryptKeySet(trace);
    expectOk(encryptingAndDecryptingKeys);

    const valueSchema = schema.object({
      one: schema.number(),
      two: schema.string()
    });

    const decrypted = await decryptValue(trace, {
      encryptedValue: base64String.makeWithUtf8String('INVALID'),
      valueSchema,
      decryptingKeys: encryptingAndDecryptingKeys.value
    });
    expectNotOk(decrypted);
  });

  it('should return a schema validation error for invalid values', async (t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await generateCryptoEncryptDecryptKeySet(trace);
    expectOk(encryptingAndDecryptingKeys);

    const value = { one: 3.14, two: '' };
    const valueSchema1 = schema.object({
      one: schema.number(),
      two: schema.string().allowEmptyString()
    });

    const encrypted = await encryptValue(trace, { value, valueSchema: valueSchema1, encryptingKeys: encryptingAndDecryptingKeys.value });
    expectOk(encrypted);

    const valueSchema2 = schema.object({
      one: schema.number(),
      two: schema.string()
    });

    const decrypted = await decryptValue(trace, {
      encryptedValue: encrypted.value,
      valueSchema: valueSchema2,
      decryptingKeys: encryptingAndDecryptingKeys.value
    });
    expectNotOk(decrypted);
    t.assert.strictEqual(decrypted.value instanceof InternalSchemaValidationError, true);
  });
});
