import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectNotOk, expectOk, sleep } from 'freedom-testing-tools';

import { GeneralError } from '../../types/GeneralError.ts';
import { makeFailure, makeSuccess } from '../../types/Result.ts';
import { doInBatches } from '../doInBatches.ts';

describe('doInBatches', () => {
  it('should work with all success results', async (t: TestContext) => {
    const allData = Array(1000)
      .fill(0)
      .map((_, index) => index);

    const trackedBatches: Array<number[]> = [];
    const trace = makeTrace('test');
    const result = await doInBatches(
      trace,
      async (_trace, offset) => makeSuccess(allData.slice(offset, offset + 50)),
      async (_trace, batch) => {
        await sleep(Math.random() * 100);
        trackedBatches.push(batch);

        return makeSuccess(undefined);
      }
    );
    expectOk(result);

    t.assert.strictEqual(trackedBatches.length, 20);
    for (let batchIndex = 0; batchIndex < trackedBatches.length; batchIndex += 1) {
      t.assert.deepStrictEqual(
        trackedBatches[batchIndex],
        Array(50)
          .fill(0)
          .map((_, index) => batchIndex * 50 + index)
      );
    }
  });

  it('if getting a batch fails, should return that failure', async (_t: TestContext) => {
    const allData = Array(1000)
      .fill(0)
      .map((_, index) => index);

    const trackedBatches: Array<number[]> = [];
    const trace = makeTrace('test');
    const result = await doInBatches(
      trace,
      async (_trace, offset) => {
        if (offset === 0) {
          return makeSuccess(allData.slice(offset, offset + 50));
        } else {
          return makeFailure(new GeneralError(trace, new Error('something went wrong'), 'generic'));
        }
      },
      async (_trace, batch) => {
        await sleep(Math.random() * 100);
        trackedBatches.push(batch);

        return makeSuccess(undefined);
      }
    );
    expectNotOk(result);
  });

  it('if processing a batch fails, should return that failure', async (_t: TestContext) => {
    const allData = Array(1000)
      .fill(0)
      .map((_, index) => index);

    const trackedBatches: Array<number[]> = [];
    const trace = makeTrace('test');
    const result = await doInBatches(
      trace,
      async (_trace, offset) => makeSuccess(allData.slice(offset, offset + 50)),
      async (_trace, batch) => {
        await sleep(Math.random() * 100);
        trackedBatches.push(batch);

        if (batch[0] === 0) {
          return makeSuccess(undefined);
        } else {
          return makeFailure(new GeneralError(trace, new Error('something went wrong'), 'generic'));
        }
      }
    );
    expectNotOk(result);
  });
});
