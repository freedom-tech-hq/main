import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { deserialize } from '../deserialize.ts';
import { serialize } from '../serialize.ts';

const theSchema = schema.object({ one: schema.number() });

describe('serialization', () => {
  it('should work', async (t) => {
    const trace = makeTrace('test');

    const serialized = await serialize(trace, { one: 1 }, theSchema);
    expectOk(serialized);
    t.assert.deepEqual(serialized.value.serializedValue, { one: 1 });

    const deserialized = await deserialize(trace, serialized.value);
    expectOk(deserialized);
    t.assert.deepEqual(deserialized.value, { one: 1 });
  });
});
