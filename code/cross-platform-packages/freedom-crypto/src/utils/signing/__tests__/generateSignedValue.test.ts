import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { InternalSchemaValidationError } from 'freedom-common-errors';
import { makeTrace } from 'freedom-contexts';
import { expectNotOk, expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { generateCryptoSignVerifyKeySet } from '../../key-generation/generateCryptoSignVerifyKeySet.ts';
import { generateSignedValue } from '../generateSignedValue.ts';

describe('generateSignedValue', () => {
  it('should work with valid values', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const signingAndVerifyingKeys = await generateCryptoSignVerifyKeySet(trace);
    expectOk(signingAndVerifyingKeys);

    const value = { one: 3.14, two: 'hello world' };
    const valueSchema = schema.object({
      one: schema.number(),
      two: schema.string()
    });

    const signedValue = await generateSignedValue(trace, {
      value,
      valueSchema,
      signingKeys: signingAndVerifyingKeys.value,
      signatureExtras: undefined,
      signatureExtrasSchema: undefined
    });
    expectOk(signedValue);
  });

  it('should return a schema validation error for invalid values', async (t: TestContext) => {
    const trace = makeTrace('test');

    const signingAndVerifyingKeys = await generateCryptoSignVerifyKeySet(trace);
    expectOk(signingAndVerifyingKeys);

    const value = { one: 3.14, two: '' };
    const valueSchema = schema.object({
      one: schema.number(),
      two: schema.string()
    });

    const signedValue = await generateSignedValue(trace, {
      value,
      valueSchema,
      signingKeys: signingAndVerifyingKeys.value,
      signatureExtras: undefined,
      signatureExtrasSchema: undefined
    });
    expectNotOk(signedValue);
    t.assert.strictEqual(signedValue.value instanceof InternalSchemaValidationError, true);
  });
});
