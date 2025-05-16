import type { Lock as RedlockLock } from '@sesamecare-oss/redlock';
import { Redlock, ResourceLockedError } from '@sesamecare-oss/redlock';
import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess, sleep } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import { makeUuid, type Trace } from 'freedom-contexts';
import type { Lock, LockOptions, LockStore, LockToken } from 'freedom-locking-types';
import { DEFAULT_LOCK_AUTO_RELEASE_AFTER_MSEC, DEFAULT_LOCK_TIMEOUT_MSEC, lockTokenInfo } from 'freedom-locking-types';
import type Redis from 'ioredis';

// TODO: move to its own package

interface HeldLockInfo<KeyT extends string> {
  key: KeyT;
  redlockLock: RedlockLock;
}

export interface RedlockStoreOptions {
  /**
   * The expected clock drift, which is multiplied by lock ttl to determine drift time
   * @see {@link https://redis.io/topics/distlock}
   */
  driftFactor?: number;
  /** @defaultValue `5` */
  retryDelayMSec?: number;
  /** @defaultValue `5` */
  retryJitterMSec?: number;
}

const defaultOptions: Required<RedlockStoreOptions> = {
  driftFactor: 0.01,
  retryDelayMSec: 5,
  retryJitterMSec: 5
};

export class RedlockStore<KeyT extends string> implements LockStore<KeyT> {
  public readonly uid = makeUuid();

  private readonly redlock_: Redlock;
  private readonly heldLocks_ = new Map<LockToken, HeldLockInfo<KeyT>>();
  private readonly storeOptions_: Required<RedlockStoreOptions>;

  /**
   * Creates an instance of RedlockStore.
   * @param redisClients - An array of one or more ioredis client instances.
   * @param options - Optional configuration for the Redlock instance.
   */
  constructor(redisClients: Redis[], options?: RedlockStoreOptions) {
    /* node:coverage disable */
    if (redisClients.length === 0) {
      throw new Error('At least one Redis client must be provided to RedlockStore.');
    }
    /* node:coverage enable */

    this.storeOptions_ = {
      driftFactor: options?.driftFactor ?? defaultOptions.driftFactor,
      retryDelayMSec: options?.retryDelayMSec ?? defaultOptions.retryDelayMSec,
      retryJitterMSec: options?.retryJitterMSec ?? defaultOptions.retryJitterMSec
    };

    // Default redlock options can be fine-tuned here if needed
    this.redlock_ = new Redlock(redisClients, { driftFactor: this.storeOptions_.driftFactor, retryCount: 0 });

    // It's good practice to listen for errors on the redlock instance
    this.redlock_.on('error', (error) => {
      // TODO: Consider proper logging instead of console.error for production
      // Avoid logging ResourceLockedError as it's an expected part of contention
      /* node:coverage disable */
      if (!(error instanceof ResourceLockedError)) {
        console.error('Redlock internal error:', error);
      }
      /* node:coverage enable */
    });
  }

  public lock(key: KeyT): Lock {
    const acquire: Lock['acquire'] = makeAsyncResultFunc(
      [import.meta.filename, 'acquire'],
      async (trace, options?: LockOptions): PR<LockToken, 'lock-timeout'> => {
        const autoReleaseAfterMSec = options?.autoReleaseAfterMSec ?? DEFAULT_LOCK_AUTO_RELEASE_AFTER_MSEC;
        const timeoutMSec = options?.timeoutMSec ?? DEFAULT_LOCK_TIMEOUT_MSEC;

        const start = performance.now();
        do {
          try {
            const redlockLock: RedlockLock = await this.redlock_.acquire([key], autoReleaseAfterMSec);

            const token = lockTokenInfo.make(makeUuid());
            this.heldLocks_.set(token, { key, redlockLock });

            return makeSuccess(token);
          } catch (_e) {
            // Redlock throws an error if the lock cannot be acquired after all retries.
            // This error is typically an ExecutionError or ResourceLockedError.
            await sleep(this.storeOptions_.retryDelayMSec + Math.random() * this.storeOptions_.retryJitterMSec);
          }
        } while (performance.now() - start < timeoutMSec);

        return makeFailure(
          new InternalStateError(trace, {
            message: `Failed to acquire Redlock for key ${JSON.stringify(key)} within configured retries.`,
            errorCode: 'lock-timeout'
          })
        );
      }
    );

    const release: Lock['release'] = makeAsyncResultFunc(
      [import.meta.filename, 'release'],
      async (trace: Trace, token: LockToken): PR<undefined> => {
        const found = this.heldLocks_.get(token);
        /* node:coverage disable */
        if (found?.key !== key) {
          return makeSuccess(undefined); // Nothing to do / wrong key (ignoring)
        }
        /* node:coverage enable */

        try {
          await found.redlockLock.release();
          return makeSuccess(undefined);
        } catch (e) {
          /* node:coverage disable */
          return makeFailure(
            new InternalStateError(trace, {
              message: `Failed to release Redlock for key ${JSON.stringify(key)}.`,
              cause: new GeneralError(trace, e)
            })
          );
          /* node:coverage enable */
        }
      }
    );

    return { uid: `${this.uid}.${key}`, acquire, release };
  }
}
