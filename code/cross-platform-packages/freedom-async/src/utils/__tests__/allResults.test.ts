import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectErrorCode, expectOk } from 'freedom-testing-tools';

import { makeDelayedFailureResult } from '../../__test_dependency__/makeDelayedFailureResult.ts';
import { makeDelayedSuccessResult } from '../../__test_dependency__/makeDelayedSuccessResult.ts';
import type { PR } from '../../types/PR.ts';
import type { Result } from '../../types/Result.ts';
import { allResults } from '../allResults.ts';

describe('allResults', () => {
  it('should work when empty', async (t: TestContext) => {
    const trace = makeTrace('test');
    const results = await allResults(trace, []);
    expectOk(results);
    t.assert.deepStrictEqual(results.value, []);
  });

  it('should work with all successful results', async (t: TestContext) => {
    const trace = makeTrace('test');
    const results = await allResults(trace, [
      makeDelayedSuccessResult(trace, 3.14),
      makeDelayedSuccessResult(trace, 6.28),
      makeDelayedSuccessResult(trace, -4),
      makeDelayedSuccessResult(trace, 100)
    ]);
    expectOk(results);
    t.assert.deepStrictEqual(results.value, [3.14, 6.28, -4, 100]);
  });

  it('should return first failure', async (_t: TestContext) => {
    const trace = makeTrace('test');
    const results = await allResults(trace, [
      makeDelayedSuccessResult(trace, 3.14),
      makeDelayedFailureResult<number, 'one'>(trace, 'one'),
      makeDelayedSuccessResult(trace, -4),
      makeDelayedFailureResult<number, 'two'>(trace, 'two')
    ]);
    expectErrorCode(results, 'one');
  });

  it('should wait for all results, even if one fails', async (t: TestContext) => {
    const tracked: Result<number, 'one' | 'two'>[] = [];
    const trackResult = async (index: number, result: PR<number, 'one' | 'two'>): PR<number, 'one' | 'two'> => {
      const res = await result;
      tracked[index] = res;
      return res;
    };

    const trace = makeTrace('test');
    const results = await allResults(trace, [
      trackResult(0, makeDelayedSuccessResult(trace, 3.14)),
      trackResult(1, makeDelayedFailureResult<number, 'one'>(trace, 'one')),
      trackResult(2, makeDelayedSuccessResult(trace, -4)),
      trackResult(3, makeDelayedFailureResult<number, 'two'>(trace, 'two'))
    ]);
    expectErrorCode(results, 'one');
    t.assert.strictEqual(tracked.length, 4);
    expectOk(tracked[0]);
    t.assert.strictEqual(tracked[0].value, 3.14);
    expectErrorCode(tracked[1], 'one');
    expectOk(tracked[2]);
    t.assert.strictEqual(tracked[2].value, -4);
    expectErrorCode(tracked[3], 'two');
  });
});
