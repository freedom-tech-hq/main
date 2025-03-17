import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectAsyncThrows, expectErrorCode, expectOk, sleep } from 'freedom-testing-tools';

import { makeDelayedFailureResult } from '../../__test_dependency__/makeDelayedFailureResult.ts';
import { makeDelayedSuccessResult } from '../../__test_dependency__/makeDelayedSuccessResult.ts';
import type { PR } from '../../types/PR.ts';
import { makeSuccess } from '../../types/Result.ts';
import { callAsyncResultFunc } from '../callAsyncResultFunc.ts';

describe('callAsyncResultFunc', () => {
  it('should work with success values', async (t: TestContext) => {
    const trace = makeTrace('test');
    const result = await callAsyncResultFunc(trace, {}, async (trace) => makeDelayedSuccessResult(trace, 3.14));
    expectOk(result);
    t.assert.strictEqual(result.value, 3.14);
  });

  it('should work with failure values', async (_t: TestContext) => {
    const trace = makeTrace('test');
    const result = await callAsyncResultFunc(trace, {}, async (trace) => makeDelayedFailureResult(trace, 'generic'));
    expectErrorCode(result, 'generic');
  });

  it('should work with thrown errors', async (_t: TestContext) => {
    const trace = makeTrace('test');

    await expectAsyncThrows(() =>
      callAsyncResultFunc(trace, {}, async (_trace): PR<number> => {
        await sleep(Math.random() * 100);
        throw new Error('something went wrong');
      })
    );
  });

  it('should retry when retry settings are added and there is a failure', async (t: TestContext) => {
    const trace = makeTrace('test');
    let count = 0;
    const result = await callAsyncResultFunc(
      trace,
      { shouldRetry: () => ({ retry: true, delayMSec: Math.random() * 100 }) },
      async (trace) => {
        count += 1;
        if (count < 3) {
          return makeDelayedFailureResult(trace, 'generic');
        } else {
          return makeSuccess(3.14);
        }
      }
    );
    expectOk(result);
    t.assert.strictEqual(count, 3);
  });

  it('should retry up to the specified number of times', async (t: TestContext) => {
    const trace = makeTrace('test');
    let count = 0;
    const result = await callAsyncResultFunc(
      trace,
      { shouldRetry: (_failure, { attemptCount }) => ({ retry: attemptCount < 3, delayMSec: Math.random() * 100 }) },
      async (trace) => {
        count += 1;
        return makeDelayedFailureResult(trace, 'generic');
      }
    );
    expectErrorCode(result, 'generic');
    t.assert.strictEqual(count, 4);
  });
});
