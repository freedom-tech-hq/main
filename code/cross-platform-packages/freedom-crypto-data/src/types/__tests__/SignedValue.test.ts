import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { base64String } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { makeSignedValue, makeSignedValueSchema } from '../SignedValue.ts';

describe('SignedValue', () => {
  it('should work', async (t: TestContext) => {
    const signedValueSchema = makeSignedValueSchema(
      schema.object({
        one: schema.number(),
        two: schema.string()
      }),
      undefined
    );

    const originalSignature = base64String.makeWithUtf8String('mock-signature');
    const originalValue = {
      one: 3.14,
      two: 'hello world'
    };

    const serialization = await signedValueSchema.serializeAsync(
      makeSignedValue({
        signature: originalSignature,
        value: originalValue,
        valueSchema: signedValueSchema.valueSchema,
        signatureExtrasSchema: undefined
      })
    );
    t.assert.strictEqual(serialization.error, undefined);
    t.assert.strictEqual(typeof serialization.serialized, 'string');

    const deserialization = await signedValueSchema.deserializeAsync(serialization.serialized);
    t.assert.strictEqual(deserialization.error, undefined);
    t.assert.strictEqual(deserialization.deserialized?.signature, originalSignature);
    t.assert.deepStrictEqual(deserialization.deserialized?.value, originalValue);
  });
});
