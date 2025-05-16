import { GeneralError, makeFailure, makeSuccess, type PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { LockStore } from 'freedom-locking-types';
import Redis from 'ioredis';

import type { RedlockStoreOptions } from '../classes/RedlockStore.ts';
import { RedlockStore } from '../classes/RedlockStore.ts';

export interface CreateRedlockStoreOptions extends RedlockStoreOptions {
  /** Server env setup */
  host: string;
  port: number;
  password: string | undefined;

  // Also see extends RedlockStoreOptions
}

/**
 * Creates a new RedlockStore instance with a configured Redis client.
 * @param options - Server env configuration
 * @returns A promise that resolves to a RedlockStore instance
 */
export const createRedlockStore = makeAsyncResultFunc(
  [import.meta.filename],
  async <T extends string = string>(trace: Trace, options: CreateRedlockStoreOptions): PR<LockStore<T>> => {
    const { host, port, password, ...redlockOptions } = options;

    // Create Redis client
    const redisClient = new Redis({
      host,
      port,
      password
    });

    // Connect and test connection
    // Testing is required, because when you access a password-protected server with no password, it fails only on this
    // operation, not in the constructor and not in connect().
    try {
      await redisClient.ping();
    } catch (error) {
      await redisClient.quit();
      return makeFailure(new GeneralError(trace, error));
    }

    // Create LockStore
    const lockStore = new RedlockStore<string>([redisClient], redlockOptions);

    // Done
    return makeSuccess(lockStore);
  }
);
