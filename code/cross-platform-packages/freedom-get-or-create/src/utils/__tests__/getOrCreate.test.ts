import { beforeEach, describe, it } from 'node:test';

import { makeFailure, makeSuccess, type PR } from 'freedom-async';
import { ConflictError, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';
import { expectOk, expectStrictEqual } from 'freedom-testing-tools';

import { getOrCreate } from '../getOrCreate.ts';

describe('getOrCreate', () => {
  const trace = makeTrace('test');

  let getCallCount = 0;
  let createCallCount = 0;
  let value: string | undefined;

  beforeEach(() => {
    value = undefined;
    getCallCount = 0;
    createCallCount = 0;
  });

  const getter = async (trace: Trace): PR<string, 'not-found'> => {
    getCallCount += 1;

    if (value === undefined) {
      return makeFailure(new NotFoundError(trace, { errorCode: 'not-found' }));
    }

    return makeSuccess(value);
  };

  const creatorThatReturnsUndefined = async (trace: Trace): PR<string | undefined, 'conflict'> => {
    createCallCount += 1;

    if (value !== undefined) {
      return makeFailure(new ConflictError(trace, { errorCode: 'conflict' }));
    }

    value = 'hello world';

    return makeSuccess(undefined);
  };

  const creatorThatReturnsValue = async (trace: Trace): PR<string | undefined, 'conflict'> => {
    createCallCount += 1;

    if (value !== undefined) {
      return makeFailure(new ConflictError(trace, { errorCode: 'conflict' }));
    }

    value = 'hello world';

    return makeSuccess(value);
  };

  it('should work with creator that returns undefined', async () => {
    const got = await getOrCreate(trace, { get: getter, create: creatorThatReturnsUndefined });
    expectOk(got);
    expectStrictEqual(got.value, 'hello world');
    expectStrictEqual(getCallCount, 2);
    expectStrictEqual(createCallCount, 1);
  });

  it('should work with creator that returns value', async () => {
    const got = await getOrCreate(trace, { get: getter, create: creatorThatReturnsValue });
    expectOk(got);
    expectStrictEqual(got.value, 'hello world');
    expectStrictEqual(getCallCount, 1);
    expectStrictEqual(createCallCount, 1);
  });

  it('should only call the creator once', async () => {
    const got1 = await getOrCreate(trace, { get: getter, create: creatorThatReturnsUndefined });
    expectOk(got1);
    expectStrictEqual(got1.value, 'hello world');
    expectStrictEqual(getCallCount, 2);
    expectStrictEqual(createCallCount, 1);

    const got2 = await getOrCreate(trace, { get: getter, create: creatorThatReturnsUndefined });
    expectOk(got2);
    expectStrictEqual(got1.value, 'hello world');
    expectStrictEqual(getCallCount, 3);
    expectStrictEqual(createCallCount, 1);
  });
});
