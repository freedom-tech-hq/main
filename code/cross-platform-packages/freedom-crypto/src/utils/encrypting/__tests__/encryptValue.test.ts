import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { InternalSchemaValidationError } from 'freedom-common-errors';
import { makeTrace } from 'freedom-contexts';
import { expectNotOk, expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { generateCryptoEncryptDecryptKeySet } from '../../key-generation/generateCryptoEncryptDecryptKeySet.ts';
import { encryptValue } from '../encryptValue.ts';

describe('encryptValue', () => {
  it('should work with valid values', async (_t: TestContext) => {
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
  });

  it('should return a schema validation error for invalid values', async (t: TestContext) => {
    const trace = makeTrace('test');

    const encryptingAndDecryptingKeys = await generateCryptoEncryptDecryptKeySet(trace);
    expectOk(encryptingAndDecryptingKeys);

    const value = { one: 3.14, two: '' };
    const valueSchema = schema.object({
      one: schema.number(),
      two: schema.string()
    });

    const encrypted = await encryptValue(trace, { value, valueSchema, encryptingKeys: encryptingAndDecryptingKeys.value });
    expectNotOk(encrypted);
    t.assert.strictEqual(encrypted.value instanceof InternalSchemaValidationError, true);
  });
});
