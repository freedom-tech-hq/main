import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { base64String } from 'freedom-basic-data';
import { makeTrace } from 'freedom-contexts';
import { expectOk } from 'freedom-testing-tools';

import { generateCryptoSignVerifyKeySet } from '../../key-generation/generateCryptoSignVerifyKeySet.ts';
import { generateSignatureForString } from '../../signing/generateSignatureForString.ts';
import { isSignatureValidForString } from '../isSignatureValidForString.ts';

describe('isSignatureValidForString', () => {
  it('should return true for valid signatures', async (t: TestContext) => {
    const trace = makeTrace('test');

    const signingAndVerifyingKeys = await generateCryptoSignVerifyKeySet(trace);
    expectOk(signingAndVerifyingKeys);

    const value = 'hello world';

    const signature = await generateSignatureForString(trace, { value, signingKeys: signingAndVerifyingKeys.value });
    expectOk(signature);

    const isSignatureValid = await isSignatureValidForString(trace, {
      signature: signature.value,
      value,
      verifyingKeys: signingAndVerifyingKeys.value
    });
    expectOk(isSignatureValid);
    t.assert.strictEqual(isSignatureValid.value, true);
  });

  it('should return false for invalid signatures', async (t: TestContext) => {
    const trace = makeTrace('test');

    const signingAndVerifyingKeys = await generateCryptoSignVerifyKeySet(trace);
    expectOk(signingAndVerifyingKeys);

    const value = 'hello world';

    const isSignatureValid = await isSignatureValidForString(trace, {
      signature: base64String.makeWithUtf8String('INVALID'),
      value,
      verifyingKeys: signingAndVerifyingKeys.value
    });
    expectOk(isSignatureValid);
    t.assert.strictEqual(isSignatureValid.value, false);
  });
});
