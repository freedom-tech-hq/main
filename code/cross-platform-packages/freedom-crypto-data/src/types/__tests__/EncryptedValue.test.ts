import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { base64String } from 'freedom-basic-data';
import { schema } from 'yaschema';

import { isEncryptedValue, makeEncryptedValue, makeEncryptedValueSchema } from '../EncryptedValue.ts';

describe('EncryptedValue', () => {
  it('should work', async (t: TestContext) => {
    const theDecryptedSchema = schema.object({
      one: schema.number(),
      two: schema.string()
    });
    const theEncryptedSchema = makeEncryptedValueSchema(theDecryptedSchema);

    const mockOriginalEncryptedValue = base64String.makeWithUtf8String('mock-signature');

    const serialization = await theEncryptedSchema.serializeAsync(
      makeEncryptedValue({
        decryptedValueSchema: theDecryptedSchema,
        encryptedValue: mockOriginalEncryptedValue
      })
    );
    t.assert.strictEqual(serialization.error, undefined);
    t.assert.strictEqual(typeof serialization.serialized, 'string');

    const deserialization = await theEncryptedSchema.deserializeAsync(serialization.serialized);
    t.assert.strictEqual(deserialization.error, undefined);
    t.assert.strictEqual(deserialization.deserialized?.encryptedValue, mockOriginalEncryptedValue);
    t.assert.deepStrictEqual(deserialization.deserialized?.decryptedValueSchema, theDecryptedSchema);
  });

  it('isEncryptedValue should work for positive cases', (t: TestContext) => {
    const mockEncryptedValue = base64String.makeWithUtf8String('mock-signature');
    const theDecryptedSchema = schema.object({
      one: schema.number(),
      two: schema.string()
    });

    t.assert.strictEqual(
      isEncryptedValue(
        makeEncryptedValue({
          encryptedValue: mockEncryptedValue,
          decryptedValueSchema: theDecryptedSchema
        })
      ),
      true
    );
  });

  it('isEncryptedValue should work for negative cases', (t: TestContext) => {
    t.assert.strictEqual(isEncryptedValue(undefined), false);
    t.assert.strictEqual(isEncryptedValue(null), false);
    t.assert.strictEqual(isEncryptedValue(3.14), false);
    t.assert.strictEqual(isEncryptedValue({}), false);
    t.assert.strictEqual(isEncryptedValue({ hello: 'world' }), false);
  });
});
