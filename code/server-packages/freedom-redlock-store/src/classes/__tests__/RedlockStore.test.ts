import { ONE_SEC_MSEC } from 'freedom-basic-data';
import { makeTestsForLockStore } from 'freedom-locking-types/tests';
import Redis from 'ioredis';

import { RedlockStore } from '../RedlockStore.ts';

makeTestsForLockStore('RedlockStore', async () => {
  // IMPORTANT: These tests require a Redis server running (e.g., localhost:6379).
  // Adjust Redis connection options if your server is elsewhere or needs authentication.
  const redisClient = new Redis(); // Defaults to 127.0.0.1:6379

  // Optional: Wait for connect or fail fast if Redis is not available
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      redisClient.removeAllListeners();
      reject(new Error('Redis connection timed out after 5 seconds. Ensure Redis is running and accessible.'));
    }, 5 * ONE_SEC_MSEC);
    redisClient.once('connect', () => {
      clearTimeout(timeout);
      resolve();
    });
    redisClient.once('error', (err) => {
      clearTimeout(timeout);
      redisClient.removeAllListeners(); // Clean up other listeners
      // Attempt to quit, though it might not be connected
      redisClient.quit().catch(() => {
        /* ignore errors on quit if not connected */
      });
      reject(new Error(`Failed to connect to Redis for RedLockStore tests: ${err.message}. Ensure Redis is running.`));
    });
  });

  const storeInstance = new RedlockStore<string>([redisClient]);
  const teardown = async () => {
    await redisClient.quit();
  };
  return [storeInstance, teardown];
});
