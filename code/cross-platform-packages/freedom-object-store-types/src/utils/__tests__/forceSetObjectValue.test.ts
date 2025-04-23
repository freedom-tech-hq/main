import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';
import { expectOk, expectStrictEqual } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { InMemoryObjectStore } from '../../types/InMemoryObjectStore.ts';
import type { StorableObject } from '../../types/StorableObject.ts';
import { forceSetObjectValue } from '../forceSetObjectValue.ts';

describe('forceSetObjectValue', () => {
  it('should work', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const objectStore = new InMemoryObjectStore({ schema: valueSchema });
    let getCallCount = 0;
    let updateCallCount = 0;
    let createCallCount = 0;

    const accessor = objectStore.mutableObject('a');

    const getter = async (trace: Trace) => {
      getCallCount += 1;
      return await accessor.getMutable(trace);
    };
    const updater = async (trace: Trace, newValue: StorableObject<number>) => {
      updateCallCount += 1;
      return await accessor.update(trace, newValue);
    };
    const creator = async (trace: Trace, initialValue: number) => {
      createCallCount += 1;
      return await accessor.create(trace, initialValue);
    };

    const set1 = await forceSetObjectValue(trace, { getMutable: getter, update: updater, create: creator }, 6.28);
    expectOk(set1);
    expectStrictEqual(getCallCount, 1);
    expectStrictEqual(updateCallCount, 0);
    expectStrictEqual(createCallCount, 1);

    const set2 = await forceSetObjectValue(trace, { getMutable: getter, update: updater, create: creator }, 9.42);
    expectOk(set2);
    expectStrictEqual(getCallCount, 2);
    expectStrictEqual(updateCallCount, 1);
    expectStrictEqual(createCallCount, 1);
  });
});

// Helpers

const valueSchema = schema.number();
