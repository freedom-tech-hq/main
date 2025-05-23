import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { sleep } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';

import { DEFAULT_LOCK_AUTO_RELEASE_AFTER_MSEC } from '../consts/timeout.ts';
import type { LockStore } from '../types/LockStore.ts';

const lockKey = 'myTestResource';

export const makeTestsForLockStore = (typeName: string, makeLockStore: () => Promise<[LockStore<string>, () => Promise<void>]>) => {
  describe(typeName, () => {
    let store: LockStore<string>;
    let teardown: () => Promise<void>;

    const trace = makeTrace('test');

    beforeEach(async () => {
      [store, teardown] = await makeLockStore();
    });

    afterEach(async () => {
      await teardown();
    });

    it('should lock and unlock a single entity', async () => {
      // Arrange
      const lock = store.lock(lockKey);

      // Act: Acquire the lock
      const acquireResult1 = await lock.acquire(trace);

      // Assert: First acquisition is successful
      assert(acquireResult1.ok, 'First acquire should be successful');
      const token1 = acquireResult1.value;

      // Act: Release the lock
      const releaseResult = await lock.release(trace, token1);

      // Assert: Release is successful
      assert(releaseResult.ok, 'Release should be successful');

      // Act: Acquire the lock again
      const acquireResult2 = await lock.acquire(trace);

      // Assert: Second acquisition is successful
      assert(acquireResult2.ok, 'Second acquire after release should be successful');
      const token2 = acquireResult2.value;

      // Cleanup: Release the second lock
      await lock.release(trace, token2);
    });

    it('should prevent acquiring a lock already held by another acquirer', async () => {
      // Arrange
      const lock = store.lock(lockKey);

      // Act: Acquire the lock first time
      const acquireResult1 = await lock.acquire(trace);

      // Assert: First acquisition is successful
      assert(acquireResult1.ok, 'First acquire should be successful');
      const token1 = acquireResult1.value;

      // Act: Attempt to acquire the same lock again with zero timeout
      const acquireResult2 = await lock.acquire(trace, { timeoutMSec: 0 });

      // Assert: Second acquisition attempt fails with 'lock-timeout'
      assert(!acquireResult2.ok, 'Second acquire should fail');
      assert.strictEqual(acquireResult2.value.errorCode, 'lock-timeout', 'Error code should be lock-timeout');

      // Cleanup: Release the first lock
      await lock.release(trace, token1);
    });

    it('should allow acquiring a lock if a previous lock has auto-released due to expiration', async () => {
      // Arrange
      const lock = store.lock(lockKey);
      const shortAutoReleaseTime = 50; // ms

      // Act: Acquire the lock with a short auto-release time
      const acquireResult1 = await lock.acquire(trace, {
        autoReleaseAfterMSec: shortAutoReleaseTime
      });

      // Assert: First acquisition is successful
      assert(acquireResult1.ok, 'First acquire with auto-release should be successful');
      // const token1 = acquireResult1.value; // Not strictly needed as it auto-releases

      // Act: Wait for longer than the auto-release time
      // TODO: replace with timekeeper
      await sleep(shortAutoReleaseTime + 50); // Wait a bit longer to ensure expiry

      // Act: Attempt to acquire the lock again
      const acquireResult2 = await lock.acquire(trace, { timeoutMSec: 0 });

      // Assert: Second acquisition should be successful as the first lock should have auto-released
      assert(acquireResult2.ok, 'Second acquire should be successful after auto-release');
      const token2 = acquireResult2.value;

      // Cleanup: Release the second lock
      await lock.release(trace, token2);
    });

    it('should respect acquisition timeout if lock is held', async () => {
      // Arrange
      const lock = store.lock(lockKey);
      const veryLongAutoReleaseTime = DEFAULT_LOCK_AUTO_RELEASE_AFTER_MSEC;
      const shortAcquireTimeout = 50; // ms

      // Act: Acquire the lock first time (process A)
      const acquireResultA = await lock.acquire(trace, { autoReleaseAfterMSec: veryLongAutoReleaseTime });
      assert(acquireResultA.ok, 'Process A: acquire should be successful');
      const tokenA = acquireResultA.value;

      // Act: Attempt to acquire the same lock (process B) with a short timeout
      const startTimeB = Date.now();
      const acquireResultB = await lock.acquire(trace, { timeoutMSec: shortAcquireTimeout });
      const durationB = Date.now() - startTimeB;

      // Assert: Process B's acquisition attempt fails due to timeout
      assert(!acquireResultB.ok, 'Process B: acquire should fail due to timeout');
      assert.strictEqual(acquireResultB.value.errorCode, 'lock-timeout', 'Process B: Error code should be lock-timeout');
      assert(
        durationB >= shortAcquireTimeout && durationB < shortAcquireTimeout + 50, // Allow some buffer
        `Process B: Acquisition attempt took ${durationB}ms, expected around ${shortAcquireTimeout}ms`
      );

      // Cleanup: Release process A's lock
      await lock.release(trace, tokenA);
    });
  });
};
