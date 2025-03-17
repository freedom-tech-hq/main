import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectOk } from 'freedom-testing-tools';

import { generateCryptoSignVerifyKeySet } from '../../key-generation/generateCryptoSignVerifyKeySet.ts';
import { generateSignedBuffer } from '../../signing/generateSignedBuffer.ts';
import { extractKeyIdFromSignedBuffer } from '../extractKeyIdFromSignedBuffer.ts';
import { extractValueFromSignedBuffer } from '../extractValueFromSignedBuffer.ts';
import { isSignatureValidForSignedBuffer } from '../isSignatureValidForSignedBuffer.ts';

describe('extractValueFromSignedBuffer', () => {
  it('should work', async (t: TestContext) => {
    const trace = makeTrace('test');

    const signingAndVerifyingKeys = await generateCryptoSignVerifyKeySet(trace);
    expectOk(signingAndVerifyingKeys);

    const signedBuffer = await generateSignedBuffer(trace, {
      value: Buffer.from('hello world', 'utf-8'),
      signingKeys: signingAndVerifyingKeys.value
    });
    expectOk(signedBuffer);

    const isValid = await isSignatureValidForSignedBuffer(trace, {
      signedBuffer: signedBuffer.value,
      verifyingKeys: signingAndVerifyingKeys.value
    });
    expectOk(isValid);
    t.assert.strictEqual(isValid.value, true);

    const extracteKeyId = extractKeyIdFromSignedBuffer(trace, { signedBuffer: signedBuffer.value });
    expectOk(extracteKeyId);
    t.assert.strictEqual(extracteKeyId.value, signingAndVerifyingKeys.value.id);

    const extractedValue = extractValueFromSignedBuffer(trace, { signedBuffer: signedBuffer.value });
    expectOk(extractedValue);
    t.assert.notStrictEqual(extractedValue.value, undefined);
    t.assert.strictEqual(Buffer.from(extractedValue.value!).toString('utf-8'), 'hello world');
  });
});
