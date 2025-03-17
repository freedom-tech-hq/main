import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeSuccess } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import { expectAsyncThrows, expectErrorCode, expectOk, sleep } from 'freedom-testing-tools';

import { InMemoryLockStore } from '../../types/InMemoryLockStore.ts';
import { withAcquiredLock } from '../withAcquiredLock.ts';

describe('withAcquiredLock', () => {
  it('should acquire and release lock successfully', async (_t: TestContext) => {
    const trace = makeTrace('test');
    const locksStore = new InMemoryLockStore();

    const result = await withAcquiredLock(trace, locksStore.lock('a'), { timeoutMSec: 1000 }, async () => {
      await sleep(Math.random() * 100);
      return makeSuccess(undefined);
    });

    expectOk(result);
  });

  it('should return timeout error if lock cannot be acquired before the specified timeout', async (_t: TestContext) => {
    const trace = makeTrace('test');
    const locksStore = new InMemoryLockStore();

    const lockToken1 = await locksStore.lock('a').acquire(trace);
    expectOk(lockToken1);

    const result = await withAcquiredLock(trace, locksStore.lock('a'), { timeoutMSec: 100 }, async () => makeSuccess(undefined));
    expectErrorCode(result, 'lock-timeout');

    await sleep(200);

    expectOk(await locksStore.lock('a').release(trace, lockToken1.value));
  });

  it('should release lock even if callback throws an error', async (_t: TestContext) => {
    const trace = makeTrace('test');
    const locksStore = new InMemoryLockStore();

    await expectAsyncThrows(() =>
      withAcquiredLock(trace, locksStore.lock('a'), { timeoutMSec: 1000 }, async () => {
        throw new Error('callback error');
      })
    );

    const lockToken1 = await locksStore.lock('a').acquire(trace, { timeoutMSec: 0 });
    expectOk(lockToken1);
    expectOk(await locksStore.lock('a').release(trace, lockToken1.value));
  });
});
