import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { base64String } from 'freedom-basic-data';
import { makeTrace } from 'freedom-contexts';
import { expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { generateCryptoSignVerifyKeySet } from '../../key-generation/generateCryptoSignVerifyKeySet.ts';
import { generateSignedValue } from '../../signing/generateSignedValue.ts';
import { isSignedValueValid } from '../isSignedValueValid.ts';

describe('isSignedValueValid', () => {
  it('should return true for valid signatures', async (t: TestContext) => {
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

    const isSignatureValid = await isSignedValueValid(trace, signedValue.value, undefined, {
      verifyingKeys: signingAndVerifyingKeys.value
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

    const signedValue = await generateSignedValue(trace, {
      value,
      valueSchema,
      signatureExtras: extras,
      signatureExtrasSchema: extrasSchema,
      signingKeys: signingAndVerifyingKeys.value
    });
    expectOk(signedValue);

    const isSignatureValid = await isSignedValueValid(trace, signedValue.value, extras, { verifyingKeys: signingAndVerifyingKeys.value });
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

    const signedValue = await generateSignedValue(trace, {
      value,
      valueSchema,
      signingKeys: signingAndVerifyingKeys.value,
      signatureExtras: undefined,
      signatureExtrasSchema: undefined
    });
    expectOk(signedValue);

    signedValue.value.signature = base64String.makeWithUtf8String('INVALID');

    const isSignatureValid = await isSignedValueValid(trace, signedValue.value, undefined, {
      verifyingKeys: signingAndVerifyingKeys.value
    });
    expectOk(isSignatureValid);
    t.assert.strictEqual(isSignatureValid.value, false);
  });
});
