import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectErrorCode, expectOk } from 'freedom-testing-tools';

import { GeneralError } from '../../types/GeneralError.ts';
import type { Result } from '../../types/Result.ts';
import { makeFailure, makeSuccess } from '../../types/Result.ts';
import { callSyncResultFunc } from '../callSyncResultFunc.ts';

describe('callSyncResultFunc', () => {
  it('should work with success values', (t: TestContext) => {
    const trace = makeTrace('test');
    const result = callSyncResultFunc(trace, {}, (_trace) => makeSuccess(3.14));
    expectOk(result);
    t.assert.strictEqual(result.value, 3.14);
  });

  it('should work with failure values', (_t: TestContext) => {
    const trace = makeTrace('test');
    const result = callSyncResultFunc(trace, {}, (trace) => makeFailure(new GeneralError(trace, new Error('something went wrong'))));
    expectErrorCode(result, 'generic');
  });

  it('should work with thrown errors', (t: TestContext) => {
    const trace = makeTrace('test');

    t.assert.throws(() =>
      callSyncResultFunc(trace, {}, (_trace): Result<number> => {
        throw new Error('something went wrong');
      })
    );
  });
});
