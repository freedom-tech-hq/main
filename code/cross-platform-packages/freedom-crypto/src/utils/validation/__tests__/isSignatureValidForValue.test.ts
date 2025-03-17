import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { base64String } from 'freedom-basic-data';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import { makeTrace } from 'freedom-contexts';
import { expectNotOk, expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { generateCryptoSignVerifyKeySet } from '../../key-generation/generateCryptoSignVerifyKeySet.ts';
import { generateSignatureForValue } from '../../signing/generateSignatureForValue.ts';
import { isSignatureValidForValue } from '../isSignatureValidForValue.ts';

describe('isSignatureValidForValue', () => {
  it('should return true for valid signatures', async (t: TestContext) => {
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

    const isSignatureValid = await isSignatureValidForValue(trace, {
      signature: signature.value,
      value,
      valueSchema,
      verifyingKeys: signingAndVerifyingKeys.value,
      signatureExtras: undefined,
      signatureExtrasSchema: undefined
    });
    expectOk(isSignatureValid);
    t.assert.strictEqual(isSignatureValid.value, true);
  });

  it('should return true for valid signatures with extra signature values', async (t: TestContext) => {
    const trace = makeTrace('test');

    const signingAndVerifyingKeys = await generateCryptoSignVerifyKeySet(trace);
    expectOk(signingAndVerifyingKeys);

    const value = { one: 3.14, two: 'hello world' };
    const valueSchema = schema.object({
      one: schema.number(),
      two: schema.string()
    });
    const extras = { three: 'bla' };
    const extrasSchema = schema.object({
      three: schema.string()
    });

    const signature = await generateSignatureForValue(trace, {
      value,
      valueSchema,
      signatureExtras: extras,
      signatureExtrasSchema: extrasSchema,
      signingKeys: signingAndVerifyingKeys.value
    });
    expectOk(signature);

    const isSignatureValid = await isSignatureValidForValue(trace, {
      signature: signature.value,
      value,
      valueSchema,
      signatureExtras: extras,
      signatureExtrasSchema: extrasSchema,
      verifyingKeys: signingAndVerifyingKeys.value
    });
    expectOk(isSignatureValid);
    t.assert.strictEqual(isSignatureValid.value, true);
  });

  it('should return false for invalid signatures', async (t: TestContext) => {
    const trace = makeTrace('test');

    const signingAndVerifyingKeys = await generateCryptoSignVerifyKeySet(trace);
    expectOk(signingAndVerifyingKeys);

    const value = { one: 3.14, two: 'hello world' };
    const valueSchema = schema.object({
      one: schema.number(),
      two: schema.string()
    });

    const isSignatureValid = await isSignatureValidForValue(trace, {
      signature: base64String.makeWithUtf8String('INVALID'),
      value,
      valueSchema,
      verifyingKeys: signingAndVerifyingKeys.value,
      signatureExtras: undefined,
      signatureExtrasSchema: undefined
    });
    expectOk(isSignatureValid);
    t.assert.strictEqual(isSignatureValid.value, false);
  });

  it("should return false for invalid signatures with extra signature values where the extras weren't included in the signature", async (t: TestContext) => {
    const trace = makeTrace('test');

    const signingAndVerifyingKeys = await generateCryptoSignVerifyKeySet(trace);
    expectOk(signingAndVerifyingKeys);

    const value = { one: 3.14, two: 'hello world' };
    const valueSchema = schema.object({
      one: schema.number(),
      two: schema.string()
    });
    const extras = { three: 'bla' };
    const extrasSchema = schema.object({
      three: schema.string()
    });

    const signature = await generateSignatureForValue(trace, {
      value,
      valueSchema,
      signatureExtras: extras,
      signatureExtrasSchema: extrasSchema,
      signingKeys: signingAndVerifyingKeys.value
    });
    expectOk(signature);

    const signatureWithoutExtras = await generateSignatureForValue(trace, {
      value,
      valueSchema,
      signingKeys: signingAndVerifyingKeys.value,
      signatureExtras: undefined,
      signatureExtrasSchema: undefined
    });
    expectOk(signatureWithoutExtras);

    const isSignatureValid = await isSignatureValidForValue(trace, {
      signature: signatureWithoutExtras.value,
      value,
      valueSchema,
      signatureExtras: extras,
      signatureExtrasSchema: extrasSchema,
      verifyingKeys: signingAndVerifyingKeys.value
    });
    expectOk(isSignatureValid);
    t.assert.strictEqual(isSignatureValid.value, false);
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

    const isSignatureValid = await isSignatureValidForValue(trace, {
      signature: base64String.makeWithUtf8String('INVALID'),
      value,
      valueSchema,
      verifyingKeys: signingAndVerifyingKeys.value,
      signatureExtras: undefined,
      signatureExtrasSchema: undefined
    });
    expectNotOk(isSignatureValid);
    t.assert.strictEqual(isSignatureValid.value instanceof InternalSchemaValidationError, true);
  });
});
