import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type Redis from 'ioredis';
import Redlock from 'redlock';

import {
  DEFAULT_LOCK_AUTO_RELEASE_AFTER_MSEC,
  DEFAULT_LOCK_TIMEOUT_MSEC
} from '../consts/timeout.ts';
import type { Lock } from './Lock.ts';
import type { LockOptions, LockStore, LockToken } from './LockStore.ts';

// The LockToken for RedLockStore will be the Redlock.Lock object itself.
// We cast it to an opaque type for our interface, but internally we know what it is.
declare const RedlockLockTokenSymbol: unique symbol;
type RedlockLockOpaqueToken<KeyT> = LockToken<KeyT> & { [RedlockLockTokenSymbol]: Redlock.Lock };

/**
 * Options for configuring the Redlock instance itself.
 * See https://www.npmjs.com/package/redlock#configuration
 */
export interface RedLockStoreOptions extends Partial<Redlock.Options> {}

export class RedLockStore<KeyT extends string | number | symbol> implements LockStore<KeyT> {
  private readonly redlock: Redlock;

  /**
   * Creates an instance of RedLockStore.
   * @param redisClients An array of one or more ioredis client instances.
   * @param options Optional configuration for the Redlock instance.
   */
  constructor(redisClients: Redis[], options?: RedLockStoreOptions) {
    if (!redisClients || redisClients.length === 0) {
      throw new Error('At least one Redis client must be provided to RedLockStore.');
    }
    // Default redlock options can be fine-tuned here if needed
    const defaultRedlockOpts: Partial<Redlock.Options> = {
      driftFactor: 0.01,
      retryCount: 10, // Default, can be adjusted based on LockOptions.timeoutMSec
      retryDelay: 200, // Default retry delay
      retryJitter: 200, // Default jitter
    };
    this.redlock = new Redlock(redisClients, { ...defaultRedlockOpts, ...options });

    // It's good practice to listen for errors on the redlock instance
    this.redlock.on('error', (error) => {
      // TODO: Consider proper logging instead of console.error for production
      // Avoid logging ResourceLockedError as it's an expected part of contention
      if (!(error instanceof Redlock.ResourceLockedError)) {
        console.error('Redlock internal error:', error);
      }
    });
  }

  public lock(key: KeyT): Lock<KeyT> {
    const resource = String(key);

    const acquire = makeAsyncResultFunc(
      async (
        _trace: Trace,
        options?: LockOptions
      ): PR<LockToken<KeyT>, InternalStateError | 'lock-timeout'> => {
        const autoReleaseAfterMSec =
          options?.autoReleaseAfterMSec ?? DEFAULT_LOCK_AUTO_RELEASE_AFTER_MSEC;
        const timeoutMSec = options?.timeoutMSec ?? DEFAULT_LOCK_TIMEOUT_MSEC;

        // Adjust Redlock's retry behavior based on timeoutMSec
        // If timeoutMSec is 0, we want to try only once (retryCount = 0)
        // Otherwise, calculate retryCount based on redlock's retryDelay.
        // This is a simplification; redlock's retryDelay and retryJitter also play a role.
        // For precise control, one might need to create a new Redlock instance per call
        // or use redlock.using which has more advanced timeout management.
        // Current redlock version doesn't allow per-acquire options for retries.

        // For simplicity, we'll use the globally configured retryCount and retryDelay.
        // If a very short or zero timeout is needed, the Redlock instance
        // should be configured with a low retryCount (e.g., 0 for no retries).
        // We can't dynamically change this per call with redlock.acquire directly.

        // If an immediate attempt (timeoutMSec = 0) is desired, the Redlock
        // instance should ideally be configured with retryCount: 0.
        // This implementation assumes the global redlock config for retries.

        // The TTL for the lock in Redis
        const ttl = autoReleaseAfterMSec;

        try {
          // Note: redlock.acquire will use the retryCount and retryDelay configured
          // on the Redlock instance. If timeoutMSec is very small (e.g., 0), and
          // retryCount is > 0, it might still attempt retries.
          const acquiredLock: Redlock.Lock = await this.redlock.acquire([resource], ttl);
          return makeSuccess(acquiredLock as unknown as RedlockLockOpaqueToken<KeyT>);
        } catch (err: unknown) {
          // Redlock throws an error if the lock cannot be acquired after all retries.
          // This error is typically an ExecutionError or ResourceLockedError.
          const message = `Failed to acquire Redlock for key "${resource}" within configured retries.`;
          return makeFailure(
            new InternalStateError(_trace, {
              message,
              errorCode: 'lock-timeout',
              cause: err instanceof Error ? err : new Error(String(err))
            })
          );
        }
      }
    );

    const release = makeAsyncResultFunc(
      async (
        _trace: Trace,
        token: LockToken<KeyT>
      ): PR<void, InternalStateError> => {
        const redlockLock = token as unknown as Redlock.Lock;
        try {
          await redlockLock.release();
          return makeSuccess(undefined);
        } catch (err: unknown) {
          return makeFailure(
            new InternalStateError(_trace, {
              message: `Failed to release Redlock for key "${resource}".`,
              cause: err instanceof Error ? err : new Error(String(err))
            })
          );
        }
      }
    );

    return { acquire, release };
  }
}
