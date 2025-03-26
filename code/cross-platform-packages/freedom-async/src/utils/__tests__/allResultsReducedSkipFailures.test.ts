import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectOk, sleep } from 'freedom-testing-tools';

import { makeDelayedSuccessResult } from '../../__test_dependency__/makeDelayedSuccessResult.ts';
import { GeneralError } from '../../types/GeneralError.ts';
import type { Result } from '../../types/Result.ts';
import { makeFailure, makeSuccess } from '../../types/Result.ts';
import { allResultsReducedSkipFailures } from '../allResultsReducedSkipFailures.ts';

describe('allResultsReducedSkipFailures', () => {
  it('should work when empty', async (t: TestContext) => {
    const trace = makeTrace('test');
    const values: number[] = [];
    const reduced = await allResultsReducedSkipFailures(
      trace,
      values,
      { skipErrorCodes: ['generic'] },
      (trace, value) => makeDelayedSuccessResult(trace, value + 1),
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
    const reduced = await allResultsReducedSkipFailures(
      trace,
      values,
      { skipErrorCodes: ['generic'] },
      (trace, value) => makeDelayedSuccessResult(trace, value + 1),
      async (_trace, out, value) => makeSuccess(out + value),
      0
    );
    expectOk(reduced);
    t.assert.strictEqual(reduced.value, 5050);
  });

  it('should continue processing when there are errors', async (t: TestContext) => {
    const trace = makeTrace('test');
    const values: number[] = Array(100)
      .fill(0)
      .map((_v, index) => (index % 2 === 0 ? index : -999));
    const results = await allResultsReducedSkipFailures(
      trace,
      values,
      { skipErrorCodes: ['generic'] },
      async (trace, value) => {
        await sleep(Math.random() * 100);

        let out: Result<number, 'generic'>;
        if (value === -999) {
          out = makeFailure(new GeneralError(trace, new Error('something went wrong'), 'generic'));
        } else {
          out = makeSuccess(value + 1);
        }
        return out;
      },
      async (_trace, out, value) => makeSuccess(out + value),
      0
    );
    expectOk(results);
    t.assert.strictEqual(results.value, 2500);
  });
});
