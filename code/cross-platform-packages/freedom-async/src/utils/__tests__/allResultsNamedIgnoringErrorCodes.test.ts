import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { Cast } from 'freedom-cast';
import { makeTrace } from 'freedom-contexts';
import { expectErrorCode, expectOk } from 'freedom-testing-tools';

import { makeDelayedFailureResult } from '../../__test_dependency__/makeDelayedFailureResult.ts';
import { makeDelayedSuccessResult } from '../../__test_dependency__/makeDelayedSuccessResult.ts';
import { allResultsNamedIgnoringErrorCodes } from '../allResultsNamedIgnoringErrorCodes.ts';

describe('allResultsNamedIgnoringErrorCodes', () => {
  it('should work when empty', async (t: TestContext) => {
    const trace = makeTrace('test');
    const results = await allResultsNamedIgnoringErrorCodes(trace, { ignoreErrorCodes: [] }, {});
    expectOk(results);
    t.assert.deepStrictEqual(results.value, {});
  });

  it('should work with all successful results', async (t: TestContext) => {
    const trace = makeTrace('test');
    const results = await allResultsNamedIgnoringErrorCodes(
      trace,
      { ignoreErrorCodes: ['generic'] },
      {
        one: makeDelayedSuccessResult(trace, 3.14),
        two: makeDelayedSuccessResult(trace, 6.28),
        three: makeDelayedSuccessResult(trace, -4),
        four: makeDelayedSuccessResult(trace, 100)
      }
    );
    expectOk(results);
    t.assert.deepStrictEqual(results.value, {
      one: 3.14,
      two: 6.28,
      three: -4,
      four: 100
    });
  });

  it('should ignore undefined entries', async (t: TestContext) => {
    const trace = makeTrace('test');
    const results = await allResultsNamedIgnoringErrorCodes(
      trace,
      { ignoreErrorCodes: ['generic'] },
      {
        one: makeDelayedSuccessResult(trace, 3.14),
        two: makeDelayedSuccessResult(trace, 6.28),
        three: makeDelayedSuccessResult(trace, -4),
        four: makeDelayedSuccessResult(trace, 100),
        five: undefined
      }
    );
    expectOk(results);
    t.assert.deepStrictEqual(results.value, {
      one: 3.14,
      two: 6.28,
      three: -4,
      four: 100
    });
  });

  it('should return first non-ignored failure', async (_t: TestContext) => {
    const trace = makeTrace('test');
    const v = {
      one: makeDelayedSuccessResult(trace, 3.14),
      two: makeDelayedFailureResult<number, 'one'>(trace, 'one'),
      three: makeDelayedSuccessResult(trace, -4),
      four: makeDelayedFailureResult<number, 'two'>(trace, 'two')
    };
    const results = await allResultsNamedIgnoringErrorCodes(
      trace,
      {
        _successType: Cast<number>(),
        _errorCodeType: Cast<'one' | 'two'>(),
        ignoreErrorCodes: ['one']
      },
      v
    );
    expectErrorCode(results, 'two');
  });

  it('should succeed if all failures are ignored', async (t: TestContext) => {
    const trace = makeTrace('test');
    const v = {
      one: makeDelayedSuccessResult(trace, 3.14),
      two: makeDelayedFailureResult<number, 'one'>(trace, 'one'),
      three: makeDelayedSuccessResult(trace, -4)
    };
    const results = await allResultsNamedIgnoringErrorCodes(
      trace,
      {
        _successType: Cast<number>(),
        _errorCodeType: Cast<'one'>(),
        ignoreErrorCodes: ['one']
      },
      v
    );
    expectOk(results);
    t.assert.deepStrictEqual(results.value, { one: 3.14, three: -4 });
  });
});
