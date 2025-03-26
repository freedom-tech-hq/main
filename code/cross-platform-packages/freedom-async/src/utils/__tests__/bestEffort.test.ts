import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectNotOk, expectOk } from 'freedom-testing-tools';

import { makeDelayedFailureResult } from '../../__test_dependency__/makeDelayedFailureResult.ts';
import { makeDelayedSuccessResult } from '../../__test_dependency__/makeDelayedSuccessResult.ts';
import type { PR } from '../../types/PR.ts';
import type { Result } from '../../types/Result.ts';
import { bestEffort } from '../bestEffort.ts';

describe('bestEffort', () => {
  it('should work with success', async (t: TestContext) => {
    const tracked: Result<number, 'generic'>[] = [];
    const trackResult = async (index: number, result: PR<number, 'generic'>): PR<number, 'generic'> => {
      const res = await result;
      tracked[index] = res;
      return res;
    };

    const trace = makeTrace('test');
    await bestEffort(trace, trackResult(0, makeDelayedSuccessResult(trace, 3.14)));
    t.assert.strictEqual(tracked.length, 1);
    expectOk(tracked[0]);
  });

  it('should work with functions', async (t: TestContext) => {
    const tracked: Result<number, 'generic'>[] = [];
    const trackResult = async (index: number, result: PR<number, 'generic'>): PR<number, 'generic'> => {
      const res = await result;
      tracked[index] = res;
      return res;
    };

    const trace = makeTrace('test');
    await bestEffort(trace, (trace) => trackResult(0, makeDelayedSuccessResult(trace, 3.14)));
    t.assert.strictEqual(tracked.length, 1);
    expectOk(tracked[0]);
  });

  it('should work with failure', async (t: TestContext) => {
    const tracked: Result<number, 'generic'>[] = [];
    const trackResult = async (index: number, result: PR<number, 'generic'>): PR<number, 'generic'> => {
      const res = await result;
      tracked[index] = res;
      return res;
    };

    const trace = makeTrace('test');
    await bestEffort(trace, trackResult(0, makeDelayedFailureResult(trace, 'generic')));
    t.assert.strictEqual(tracked.length, 1);
    expectNotOk(tracked[0]);
  });
});
