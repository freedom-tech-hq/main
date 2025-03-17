import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { base64String } from 'freedom-basic-data';
import { get } from 'lodash-es';
import { schema } from 'yaschema';

import { makeEncryptedValue } from '../../types/EncryptedValue.ts';
import { makeObjectWithEncryptedFieldsSchema } from '../makeObjectWithEncryptedFieldsSchema.ts';

describe('makeObjectWithEncryptedFieldsSchema', () => {
  it('should work', async (t: TestContext) => {
    const objSchema = schema.object({
      one: schema.number(),
      two: schema.string()
    });

    const encObjSchema = makeObjectWithEncryptedFieldsSchema(objSchema);
    type EncObj = typeof encObjSchema.valueType;

    const encObjValue: EncObj = {
      one: makeEncryptedValue({
        decryptedValueSchema: objSchema.map.one,
        encryptedValue: base64String.makeWithUtf8String('mock-encrypted-number')
      }),
      two: makeEncryptedValue({
        decryptedValueSchema: objSchema.map.two,
        encryptedValue: base64String.makeWithUtf8String('mock-encrypted-string')
      })
    };

    const serialization = await encObjSchema.serializeAsync(encObjValue);
    t.assert.strictEqual(serialization.error, undefined);

    t.assert.strictEqual(typeof get(serialization.serialized, 'one'), 'string');
    t.assert.strictEqual(typeof get(serialization.serialized, 'two'), 'string');

    const deserialization = await encObjSchema.deserializeAsync(serialization.serialized);
    t.assert.strictEqual(deserialization.error, undefined);

    t.assert.deepStrictEqual(deserialization.deserialized, encObjValue);
  });
});
