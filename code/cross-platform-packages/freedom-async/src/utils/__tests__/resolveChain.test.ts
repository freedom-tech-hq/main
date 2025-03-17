import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectNotOk, expectOk } from 'freedom-testing-tools';

import type { ChainableResult } from '../../types/ChainableResult.ts';
import { GeneralError } from '../../types/GeneralError.ts';
import { makeFailure, makeSuccess } from '../../types/Result.ts';
import { resolveChain } from '../resolveChain.ts';

describe('resolveChain', () => {
  it('should work with direct results', async (t: TestContext) => {
    const theResult: ChainableResult<string> = 'hello';
    const resolvedResult = await resolveChain(theResult);
    expectOk(resolvedResult);
    t.assert.strictEqual(resolvedResult.value, 'hello');
  });

  it('should work with indirect results', async (t: TestContext) => {
    const theResult: ChainableResult<string> = new Promise((resolve) => resolve(makeSuccess('hello')));
    const resolvedResult = await resolveChain(theResult);
    expectOk(resolvedResult);
    t.assert.strictEqual(resolvedResult.value, 'hello');
  });

  it('should work with indirect failure results', async (t: TestContext) => {
    const trace = makeTrace('test');
    const theResult: ChainableResult<string, 'not-found'> = new Promise((resolve) =>
      resolve(makeFailure(new GeneralError(trace, undefined, 'not-found')))
    );
    const resolvedResult = await resolveChain(theResult);
    expectNotOk(resolvedResult);
    t.assert.strictEqual(resolvedResult.value.errorCode, 'not-found');
  });
});
