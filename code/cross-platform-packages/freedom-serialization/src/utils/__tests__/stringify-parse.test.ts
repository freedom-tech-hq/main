import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { parse } from '../parse.ts';
import { stringify } from '../stringify.ts';

const theSchema = schema.object({ one: schema.number() });

describe('stringify and parse', () => {
  it('should work', async (t) => {
    const trace = makeTrace('test');

    const jsonString = await stringify(trace, { one: 1 }, theSchema);
    expectOk(jsonString);
    t.assert.deepEqual(jsonString.value, '{"one":1}');

    const parsed = await parse(trace, jsonString.value, theSchema);
    expectOk(parsed);
    t.assert.deepEqual(parsed.value, { one: 1 });
  });
});
