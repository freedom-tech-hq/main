import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectOk, sleep } from 'freedom-testing-tools';

import { makeSuccess } from '../../types/Result.ts';
import { makeRecencyCachingAsyncResultFunc } from '../makeRecencyCachingAsyncResultFunc.ts';

describe('makeRecencyCachingAsyncResultFunc', () => {
  it('should work', async (t: TestContext) => {
    let callCount = 0;
    let onExpirationCallCount = 0;

    const func = makeRecencyCachingAsyncResultFunc(
      ['test'],
      async (_trace) => {
        callCount += 1;
        return makeSuccess('hello world');
      },
      {
        recencyThresholdMSec: 50,
        onExpiration: () => {
          onExpirationCallCount += 1;
        }
      }
    );

    t.assert.strictEqual(callCount, 0);
    t.assert.strictEqual(onExpirationCallCount, 0);

    const trace = makeTrace('test');

    const result1 = await func(trace);
    expectOk(result1);
    t.assert.strictEqual(result1.value, 'hello world');

    t.assert.strictEqual(callCount, 1);
    t.assert.strictEqual(onExpirationCallCount, 0);

    const result2 = await func(trace);
    expectOk(result2);
    t.assert.strictEqual(result2.value, 'hello world');

    t.assert.strictEqual(callCount, 1);
    t.assert.strictEqual(onExpirationCallCount, 0);

    await sleep(100);

    t.assert.strictEqual(callCount, 1);
    t.assert.strictEqual(onExpirationCallCount, 1);

    const result3 = await func(trace);
    expectOk(result3);
    t.assert.strictEqual(result3.value, 'hello world');

    t.assert.strictEqual(callCount, 2);
    t.assert.strictEqual(onExpirationCallCount, 1);

    await sleep(100);

    t.assert.strictEqual(callCount, 2);
    t.assert.strictEqual(onExpirationCallCount, 2);
  });
});
