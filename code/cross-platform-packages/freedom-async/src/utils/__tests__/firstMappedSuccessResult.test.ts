import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectErrorCode, expectNotOk, expectOk, sleep } from 'freedom-testing-tools';

import { GeneralError } from '../../types/GeneralError.ts';
import type { PR } from '../../types/PR.ts';
import { makeFailure, makeSuccess } from '../../types/Result.ts';
import { firstMappedSuccessResult } from '../firstMappedSuccessResult.ts';

describe('firstMappedSuccessResult', () => {
  it('should return the first successful result if there is one', async (t: TestContext) => {
    const trace = makeTrace('test');
    const result = await firstMappedSuccessResult(trace, [1, 2, 3], async (trace, value): PR<number> => {
      await sleep(Math.random() * 100);

      if (value === 2) {
        return makeSuccess(3.14);
      } else {
        return makeFailure(new GeneralError(trace, undefined));
      }
    });
    expectOk(result);
    t.assert.strictEqual(result.value, 3.14);
  });

  it('should return the last failure result if there are no successes', async (_t: TestContext) => {
    const trace = makeTrace('test');
    const result = await firstMappedSuccessResult(trace, [1, 2, 3], async (trace) => {
      await sleep(Math.random() * 100);

      return makeFailure(new GeneralError(trace, undefined));
    });
    expectNotOk(result);
  });

  it("should return 'empty-data-set' failure if the values list is empty", async (_t: TestContext) => {
    const trace = makeTrace('test');
    const result = await firstMappedSuccessResult(trace, [], async (trace, value): PR<number> => {
      await sleep(Math.random() * 100);

      if (value === 2) {
        return makeSuccess(3.14);
      } else {
        return makeFailure(new GeneralError(trace, undefined));
      }
    });
    expectErrorCode(result, 'empty-data-set');
  });
});
