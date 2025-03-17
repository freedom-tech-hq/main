import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectErrorCode, expectNotOk, expectOk, sleep } from 'freedom-testing-tools';

import { GeneralError } from '../../types/GeneralError.ts';
import { makeFailure, makeSuccess } from '../../types/Result.ts';
import { firstSuccessResult } from '../firstSuccessResult.ts';
import { inline } from '../inline.ts';

describe('firstSuccessResult', () => {
  it('should return the first successful result if there is one', async (t: TestContext) => {
    const trace = makeTrace('test');
    const result = await firstSuccessResult<number>(trace, [
      inline(async () => {
        await sleep(Math.random() * 50);
        return makeFailure(new GeneralError(trace, undefined));
      }),
      inline(async () => {
        await sleep(Math.random() * 50);
        return makeFailure(new GeneralError(trace, undefined));
      }),
      inline(async () => {
        await sleep(Math.random() * 50);
        return makeSuccess(3.14);
      })
    ]);
    expectOk(result);
    t.assert.strictEqual(result.value, 3.14);
  });

  it('should return the last failure result if there are no successes', async (_t: TestContext) => {
    const trace = makeTrace('test');
    const result = await firstSuccessResult(trace, [
      inline(async () => {
        await sleep(Math.random() * 50);
        return makeFailure(new GeneralError(trace, undefined));
      }),
      inline(async () => {
        await sleep(Math.random() * 50);
        return makeFailure(new GeneralError(trace, undefined));
      })
    ]);
    expectNotOk(result);
  });

  it("should return 'empty-data-set' failure if the values list is empty", async (_t: TestContext) => {
    const trace = makeTrace('test');
    const result = await firstSuccessResult(trace, []);
    expectErrorCode(result, 'empty-data-set');
  });
});
