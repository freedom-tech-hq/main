import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';
import { expectOk, expectStrictEqual } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { InMemoryObjectStore } from '../../types/InMemoryObjectStore.ts';
import { getMutableObjectOrCreate } from '../getMutableObjectOrCreate.ts';

describe('getMutableObjectOrCreate', () => {
  it('should work', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ schema: valueSchema });
    let getCallCount = 0;
    let createCallCount = 0;

    const accessor = objectStore.mutableObject('a');

    const getter = async (trace: Trace) => {
      getCallCount += 1;
      return await accessor.getMutable(trace);
    };
    const creator = async (trace: Trace) => {
      createCallCount += 1;
      return await accessor.create(trace, 3.14);
    };

    const created = await getMutableObjectOrCreate(trace, { getMutable: getter, create: creator });
    expectOk(created);
    expectStrictEqual(created.value.storedValue, 3.14);

    expectStrictEqual(getCallCount, 2);
    expectStrictEqual(createCallCount, 1);

    const got = await getMutableObjectOrCreate(trace, { getMutable: getter, create: creator });
    expectOk(got);
    expectStrictEqual(got.value.storedValue, 3.14);

    expectStrictEqual(getCallCount, 3);
    expectStrictEqual(createCallCount, 1);
  });
});

// Helpers

const valueSchema = schema.number();
