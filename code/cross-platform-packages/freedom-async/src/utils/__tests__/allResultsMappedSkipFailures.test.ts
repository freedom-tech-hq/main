import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectErrorCode, expectOk, sleep } from 'freedom-testing-tools';

import { GeneralError } from '../../types/GeneralError.ts';
import type { PR } from '../../types/PR.ts';
import type { Result } from '../../types/Result.ts';
import { makeFailure, makeSuccess } from '../../types/Result.ts';
import { allResultsMappedSkipFailures } from '../allResultsMappedSkipFailures.ts';

describe('allResultsMappedSkipFailures', () => {
  it('should work when empty', async (t: TestContext) => {
    const trace = makeTrace('test');
    const results = await allResultsMappedSkipFailures(trace, [] as number[], { skipErrorCodes: ['generic'] }, async (_trace, value) => {
      await sleep(Math.random() * 100);
      return makeSuccess(value + 1);
    });
    expectOk(results);
    t.assert.strictEqual(results.value.length, 0);
  });

  it('should work with all successful results', async (t: TestContext) => {
    const trace = makeTrace('test');
    const values: number[] = Array(100)
      .fill(0)
      .map(() => Math.random() * 200 - 100);
    const results = await allResultsMappedSkipFailures(trace, values, { skipErrorCodes: ['generic'] }, async (_trace, value) => {
      await sleep(Math.random() * 100);
      return makeSuccess(value + 1);
    });
    expectOk(results);
    t.assert.deepStrictEqual(
      results.value,
      values.map((v) => v + 1)
    );
  });

  it('should continue processing when there are errors', async (t: TestContext) => {
    const trace = makeTrace('test');
    const values: number[] = Array(100)
      .fill(0)
      .map((_v, index) => (index % 2 === 0 ? Math.random() * 200 - 100 : -999));
    const tracked: Result<number, 'generic'>[] = [];
    const results = await allResultsMappedSkipFailures(trace, values, { skipErrorCodes: ['generic'] }, async (trace, value, index) => {
      await sleep(Math.random() * 100);

      let out: Result<number, 'generic'>;
      if (value === -999) {
        out = makeFailure(new GeneralError(trace, new Error('something went wrong'), 'generic'));
      } else {
        out = makeSuccess(value + 1);
      }
      tracked[index] = out;
      return out;
    });
    expectOk(results);
    t.assert.deepStrictEqual(
      results.value,
      values.map((v, index) => (index % 2 === 0 ? v + 1 : undefined))
    );
  });

  it('should stop processing on success when onSuccess = "stop"', async (t: TestContext) => {
    const trace = makeTrace('test');
    const values = [1, 2, 3, 4, 5];
    const results = await allResultsMappedSkipFailures(
      trace,
      values,
      { onSuccess: 'stop', skipErrorCodes: ['generic'] },
      async (_trace, value): PR<number> => {
        await sleep(Math.random() * 100);
        if (value === 3) {
          return makeSuccess(value);
        } else {
          return makeFailure(new GeneralError(trace, undefined));
        }
      }
    );
    expectOk(results);
    t.assert.deepStrictEqual(results.value, [undefined, undefined, 3, undefined, undefined]);
  });

  it("should not skip errors that aren't in skipErrorCodes list", async (_t: TestContext) => {
    const trace = makeTrace('test');
    const values = [1, 2, 3, 4, 5];
    const results = await allResultsMappedSkipFailures(
      trace,
      values,
      { skipErrorCodes: ['generic'] },
      async (_trace, value): PR<number, 'random'> => {
        await sleep(Math.random() * 100);
        if (value === 3) {
          return makeSuccess(value);
        } else if (value === 5) {
          return makeFailure(new GeneralError(trace, undefined, 'random'));
        } else {
          return makeFailure(new GeneralError(trace, undefined));
        }
      }
    );
    expectErrorCode(results, 'random');
  });
});
