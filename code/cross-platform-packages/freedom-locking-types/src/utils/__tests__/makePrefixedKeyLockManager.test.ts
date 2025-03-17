import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectErrorCode, expectOk } from 'freedom-testing-tools';

import { InMemoryLockStore } from '../../types/InMemoryLockStore.ts';
import { makePrefixedKeyLockStore } from '../makePrefixedKeyLockStore.ts';

describe('makePrefixedKeyLockStore', () => {
  it("should work immediately when there's no other locks", async (_t: TestContext) => {
    const trace = makeTrace('test');

    const locksStore = new InMemoryLockStore<`hello:${'a' | 'b' | 'c'}`>();
    const prefixedLockStore = makePrefixedKeyLockStore<'hello:', 'a' | 'b' | 'c'>('hello:', locksStore);

    const lockToken = await prefixedLockStore.lock('a').acquire(trace);
    expectOk(lockToken);

    expectOk(await prefixedLockStore.lock('a').release(trace, lockToken.value));
  });

  it('should immediately timeout if another lock holds with 0 timeout tolerance', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const locksStore = new InMemoryLockStore<`hello:${'a' | 'b' | 'c'}`>();
    const prefixedLockStore = makePrefixedKeyLockStore<'hello:', 'a' | 'b' | 'c'>('hello:', locksStore);

    const lockToken1 = await prefixedLockStore.lock('a').acquire(trace);
    expectOk(lockToken1);

    const lockToken2 = await prefixedLockStore.lock('a').acquire(trace, { timeoutMSec: 0 });
    expectErrorCode(lockToken2, 'lock-timeout');

    expectOk(await prefixedLockStore.lock('a').release(trace, lockToken1.value));
  });

  it('should timeout if another lock holds longer than the timeout tolerance', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const locksStore = new InMemoryLockStore<`hello:${'a' | 'b' | 'c'}`>();
    const prefixedLockStore = makePrefixedKeyLockStore<'hello:', 'a' | 'b' | 'c'>('hello:', locksStore);

    const lockToken1 = await prefixedLockStore.lock('a').acquire(trace);
    expectOk(lockToken1);

    const lockToken2 = await prefixedLockStore.lock('a').acquire(trace, { timeoutMSec: 100 });
    expectErrorCode(lockToken2, 'lock-timeout');

    expectOk(await prefixedLockStore.lock('a').release(trace, lockToken1.value));
  });

  it('should not timeout if another lock holds but then auto-releases before the timeout tolerance', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const locksStore = new InMemoryLockStore<`hello:${'a' | 'b' | 'c'}`>();
    const prefixedLockStore = makePrefixedKeyLockStore<'hello:', 'a' | 'b' | 'c'>('hello:', locksStore);

    const lockToken1 = await prefixedLockStore.lock('a').acquire(trace, { autoReleaseAfterMSec: 100 });
    expectOk(lockToken1);

    const lockToken2 = await prefixedLockStore.lock('a').acquire(trace, { timeoutMSec: 200 });
    expectOk(lockToken2);

    expectOk(await prefixedLockStore.lock('a').release(trace, lockToken2.value));

    expectOk(await prefixedLockStore.lock('a').release(trace, lockToken1.value));
  });

  it('should support chaining several locks', async (_t: TestContext) => {
    const trace = makeTrace('test');

    const locksStore = new InMemoryLockStore<`hello:${'a' | 'b' | 'c'}`>();
    const prefixedLockStore = makePrefixedKeyLockStore<'hello:', 'a' | 'b' | 'c'>('hello:', locksStore);

    const lockToken1 = await prefixedLockStore.lock('a').acquire(trace, { autoReleaseAfterMSec: 100 });
    expectOk(lockToken1);

    const lockToken2Promise = prefixedLockStore.lock('a').acquire(trace, { timeoutMSec: 200, autoReleaseAfterMSec: 100 });
    const lockToken3Promise = prefixedLockStore.lock('a').acquire(trace, { timeoutMSec: 300, autoReleaseAfterMSec: 100 });
    const lockToken4Promise = prefixedLockStore.lock('a').acquire(trace, { timeoutMSec: 100, autoReleaseAfterMSec: 100 });

    const lockToken2 = await lockToken2Promise;
    expectOk(lockToken2);

    const lockToken3 = await lockToken3Promise;
    expectOk(lockToken3);

    const lockToken4 = await lockToken4Promise;
    expectErrorCode(lockToken4, 'lock-timeout');

    expectOk(await prefixedLockStore.lock('a').release(trace, lockToken3.value));

    expectOk(await prefixedLockStore.lock('a').release(trace, lockToken2.value));

    expectOk(await prefixedLockStore.lock('a').release(trace, lockToken1.value));
  });
});
