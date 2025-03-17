import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import type { Trace } from 'freedom-contexts';
import { sleep } from 'freedom-testing-tools';

import { computeAsyncOnce } from '../computeAsyncOnce.ts';

describe('computeAsyncOnce', () => {
  it('should call a producer function with a unique key just once', async (t: TestContext) => {
    let numCalls = 0;
    const producer = async (_trace: Trace) => {
      await sleep(Math.random() * 100);
      numCalls += 1;
      return 3.14;
    };

    t.assert.strictEqual(numCalls, 0);

    const result1 = await computeAsyncOnce(['test'], 'computeAsyncOnce.test.0', producer);
    t.assert.strictEqual(result1, 3.14);
    t.assert.strictEqual(numCalls, 1);

    const result2 = await computeAsyncOnce(['test'], 'computeAsyncOnce.test.0', producer);
    t.assert.strictEqual(result2, 3.14);
    t.assert.strictEqual(numCalls, 1);
  });
});
