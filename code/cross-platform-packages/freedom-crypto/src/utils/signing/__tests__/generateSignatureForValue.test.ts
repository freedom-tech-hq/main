import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { InternalSchemaValidationError } from 'freedom-common-errors';
import { makeTrace } from 'freedom-contexts';
import { expectNotOk, expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { generateCryptoSignVerifyKeySet } from '../../key-generation/generateCryptoSignVerifyKeySet.ts';
import { generateSignatureForValue } from '../generateSignatureForValue.ts';

describe('generateSignatureForValue', () => {
  it('should work with valid values', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const signingAndVerifyingKeys = await generateCryptoSignVerifyKeySet(trace);
    expectOk(signingAndVerifyingKeys);

    const value = { one: 3.14, two: 'hello world' };
    const valueSchema = schema.object({
      one: schema.number(),
      two: schema.string()
    });

    const signature = await generateSignatureForValue(trace, {
      value,
      valueSchema,
      signingKeys: signingAndVerifyingKeys.value,
      signatureExtras: undefined,
      signatureExtrasSchema: undefined
    });
    expectOk(signature);
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

    const signature = await generateSignatureForValue(trace, {
      value,
      valueSchema,
      signingKeys: signingAndVerifyingKeys.value,
      signatureExtras: undefined,
      signatureExtrasSchema: undefined
    });
    expectNotOk(signature);
    t.assert.strictEqual(signature.value instanceof InternalSchemaValidationError, true);
  });
});
