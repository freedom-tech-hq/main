import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { schema } from 'yaschema';

import { makeSerializedValue, makeSerializedValueSchema } from '../SerializedValue.ts';
import { uint8ArraySchema } from '../Uint8Array.ts';

const valueSchema = schema.object({ a: schema.string(), b: uint8ArraySchema });
type Value = typeof valueSchema.valueType;

const serializedValueSchema = makeSerializedValueSchema(valueSchema);

describe('SerializedValue', () => {
  it('should work', async (t: TestContext) => {
    const value: Value = { a: 'a', b: Buffer.from('hello world', 'utf-8') };

    const valueSerialization = await valueSchema.serializeAsync(value, { validation: 'hard' });
    t.assert.strictEqual(valueSerialization.error, undefined);

    const serializedValueSerialization = await serializedValueSchema.serializeAsync(
      makeSerializedValue({
        valueSchema: valueSchema,
        serializedValue: valueSerialization.serialized
      })
    );
    t.assert.strictEqual(serializedValueSerialization.error, undefined);
    t.assert.strictEqual(typeof serializedValueSerialization.serialized, 'string');
    t.assert.strictEqual((serializedValueSerialization.serialized as string).startsWith('SER_'), true);

    const serializedValueDeserialization = await serializedValueSchema.deserializeAsync(serializedValueSerialization.serialized, {
      validation: 'hard'
    });
    t.assert.strictEqual(serializedValueDeserialization.error, undefined);
    t.assert.deepStrictEqual(
      serializedValueDeserialization.deserialized,
      makeSerializedValue({
        valueSchema: valueSchema,
        serializedValue: valueSerialization.serialized
      })
    );

    const valueDeserialization = await valueSchema.deserializeAsync(valueSerialization.serialized, { validation: 'hard' });
    t.assert.strictEqual(valueDeserialization.error, undefined);
    t.assert.deepStrictEqual(valueDeserialization.deserialized, value);
  });
});
