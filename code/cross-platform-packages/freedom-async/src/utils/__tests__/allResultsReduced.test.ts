import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectErrorCode, expectNotOk, expectOk, sleep } from 'freedom-testing-tools';
import { isEqual } from 'lodash-es';

import { makeDelayedSuccessResult } from '../../__test_dependency__/makeDelayedSuccessResult.ts';
import { GeneralError } from '../../types/GeneralError.ts';
import type { Result } from '../../types/Result.ts';
import { makeFailure, makeSuccess } from '../../types/Result.ts';
import { allResultsReduced } from '../allResultsReduced.ts';

describe('allResultsReduced', () => {
  it('should work when empty', async (t: TestContext) => {
    const trace = makeTrace('test');
    const values: number[] = [];
    const reduced = await allResultsReduced(
      trace,
      values,
      {},
      async (trace, value) => makeDelayedSuccessResult(trace, value + 1),
      async (_trace, out, value) => makeSuccess(out + value),
      0
    );
    expectOk(reduced);
    t.assert.strictEqual(reduced.value, 0);
  });

  it('should work for all success results', async (t: TestContext) => {
    const trace = makeTrace('test');
    const values: number[] = Array(100)
      .fill(0)
      .map((_v, index) => index);
    const reduced = await allResultsReduced(
      trace,
      values,
      {},
      async (trace, value) => makeDelayedSuccessResult(trace, value + 1),
      async (_trace, out, value) => makeSuccess(out + value),
      0
    );
    expectOk(reduced);
    t.assert.strictEqual(reduced.value, 5050);
  });

  it('when onFailure = "continue", should continue processing when there are errors', async (t: TestContext) => {
    const trace = makeTrace('test');
    const values: number[] = Array(100)
      .fill(0)
      .map((_v, index) => (index % 2 === 0 ? Math.random() * 200 - 100 : -999));
    const tracked: Result<number, 'generic'>[] = [];
    const results = await allResultsReduced(
      trace,
      values,
      { onFailure: 'continue' },
      async (trace, value, index) => {
        await sleep(Math.random() * 100);

        let out: Result<number, 'generic'>;
        if (value === -999) {
          out = makeFailure(new GeneralError(trace, new Error('something went wrong'), 'generic'));
        } else {
          out = makeSuccess(value + 1);
        }
        tracked[index] = out;
        return out;
      },
      async (_trace, out, value) => makeSuccess(out + value),
      0
    );
    expectErrorCode(results, 'generic');
    t.assert.strictEqual(
      isEqual(
        tracked,
        values.map((v, index) =>
          index % 2 === 0 ? makeSuccess(v + 1) : makeFailure(new GeneralError(trace, new Error('something went wrong'), 'generic'))
        )
      ),
      true
    );
  });

  it('when onFailure = "stop", should stop processing when there are errors', async (t: TestContext) => {
    const trace = makeTrace('test');
    const values: number[] = Array(100)
      .fill(0)
      .map((_v, index) => (index % 2 === 0 ? Math.random() * 200 - 100 : -999));
    const tracked: Result<number, 'generic'>[] = [];
    const results = await allResultsReduced(
      trace,
      values,
      { onFailure: 'stop' },
      async (trace, value, index) => {
        await sleep(Math.random() * 100);

        let out: Result<number, 'generic'>;
        if (value === -999) {
          out = makeFailure(new GeneralError(trace, new Error('something went wrong'), 'generic'));
        } else {
          out = makeSuccess(value + 1);
        }
        tracked[index] = out;
        return out;
      },
      async (_trace, out, value) => makeSuccess(out + value),
      0
    );
    expectErrorCode(results, 'generic');
    t.assert.strictEqual(tracked.length < 100, true);

    let index = 0;
    for (const trackedValue of tracked) {
      if (index % 2 === 0) {
        expectOk(trackedValue);
      } else {
        expectNotOk(trackedValue);
      }
      index += 1;
    }
  });
});
