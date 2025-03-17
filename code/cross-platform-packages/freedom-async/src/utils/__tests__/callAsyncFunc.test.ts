import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectAsyncThrows, sleep } from 'freedom-testing-tools';

import { callAsyncFunc } from '../callAsyncFunc.ts';

describe('callAsyncFunc', () => {
  it('should work with returned values', async (t: TestContext) => {
    const trace = makeTrace('test');
    const result = await callAsyncFunc(trace, {}, async (_trace) => {
      await sleep(Math.random() * 100);
      return 3.14;
    });
    t.assert.strictEqual(result, 3.14);
  });

  it('should work with void results', async (t: TestContext) => {
    const trace = makeTrace('test');
    let numCalls = 0;
    await callAsyncFunc(trace, {}, async (_trace) => {
      await sleep(Math.random() * 100);
      numCalls += 1;
    });
    t.assert.strictEqual(numCalls, 1);
  });

  it('should work with thrown errors', async (_t: TestContext) => {
    const trace = makeTrace('test');

    await expectAsyncThrows(() =>
      callAsyncFunc(trace, {}, async (_trace) => {
        await sleep(Math.random() * 100);
        throw new Error('something went wrong');
      })
    );
  });
});
