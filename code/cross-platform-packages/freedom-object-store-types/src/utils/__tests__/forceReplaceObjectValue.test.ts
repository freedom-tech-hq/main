import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';
import { expectOk, expectStrictEqual } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { InMemoryObjectStore } from '../../types/InMemoryObjectStore.ts';
import type { StorableObject } from '../../types/StorableObject.ts';
import { forceReplaceObjectValue } from '../forceReplaceObjectValue.ts';

describe('forceReplaceObjectValue', () => {
  it('should work', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ schema: valueSchema });
    let getCallCount = 0;
    let updateCallCount = 0;

    const accessor = objectStore.mutableObject('a');

    const getter = async (trace: Trace) => {
      getCallCount += 1;
      return await accessor.getMutable(trace);
    };
    const updater = async (trace: Trace, newValue: StorableObject<number>) => {
      updateCallCount += 1;
      return await accessor.update(trace, newValue);
    };

    const created = await accessor.create(trace, 3.14);
    expectOk(created);

    const replaced = await forceReplaceObjectValue(trace, { getMutable: getter, update: updater }, 6.28);
    expectOk(replaced);
    expectStrictEqual(getCallCount, 1);
    expectStrictEqual(updateCallCount, 1);
  });
});

// Helpers

const valueSchema = schema.number();
