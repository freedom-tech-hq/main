import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, sleep } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import type { Lock, LockOptions, LockStore, LockToken } from 'freedom-locking-types';
import { DEFAULT_LOCK_AUTO_RELEASE_AFTER_MSEC, DEFAULT_LOCK_TIMEOUT_MSEC, lockTokenInfo } from 'freedom-locking-types';
import { promises as fs } from 'fs';
import * as path from 'path';
import { setTimeout } from 'timers';

interface HeldLockInfo<KeyT extends string> {
  key: KeyT;
  autoReleaseTimeout: ReturnType<typeof setTimeout>;
}

export interface FileLockStoreOptions {
  /** @defaultValue `5` */
  retryDelayMSec?: number;
  /** @defaultValue `5` */
  retryJitterMSec?: number;
}

const defaultOptions: Required<FileLockStoreOptions> = {
  retryDelayMSec: 5,
  retryJitterMSec: 5
};

export class FileLockStore<KeyT extends string> implements LockStore<KeyT> {
  public readonly uid = makeUuid();

  private readonly dir_: string;
  private readonly heldLocks_ = new Map<LockToken, HeldLockInfo<KeyT>>();
  private readonly storeOptions_: Required<FileLockStoreOptions>;

  constructor(dir: string, options?: FileLockStoreOptions) {
    this.dir_ = dir;

    this.storeOptions_ = {
      retryDelayMSec: options?.retryDelayMSec ?? defaultOptions.retryDelayMSec,
      retryJitterMSec: options?.retryJitterMSec ?? defaultOptions.retryJitterMSec
    };
  }

  public lock(key: KeyT): Lock {
    const lockFile = path.join(this.dir_, `${key}.lock`);
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- we return a sub-object
    const store = this;

    return {
      uid: `${this.uid}.${key}`,
      acquire: makeAsyncResultFunc(
        [import.meta.filename, 'acquire'],
        async (
          trace,
          { timeoutMSec = DEFAULT_LOCK_TIMEOUT_MSEC, autoReleaseAfterMSec = DEFAULT_LOCK_AUTO_RELEASE_AFTER_MSEC }: LockOptions = {}
        ): PR<LockToken, 'lock-timeout'> => {
          const start = Date.now();
          while (true) {
            try {
              // Try to exclusively create the lock file
              const fd = await fs.open(lockFile, 'wx', 0o600);
              await fd.close();
              // Got the lock
              const token = lockTokenInfo.make(makeUuid());
              // If fs.open('wx') succeeded, this instance acquired the lock.
              // The store.heldLocks.has(key) check here was problematic as it would undo a successful acquisition.
              // Internal consistency of heldLocks should be managed by release/cleanup logic.

              // Setup auto-release
              const autoReleaseTimeout = setTimeout(() => store.releaseLockFile_(trace, lockFile, key, token), autoReleaseAfterMSec);

              store.heldLocks_.set(token, { key, autoReleaseTimeout });

              return makeSuccess(token);
            } catch (err) {
              // Check if it's an error object with a 'code' property
              if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'EEXIST') {
                // File exists: someone else holds the lock
                if (Date.now() - start > timeoutMSec) {
                  return makeFailure(
                    new InternalStateError(trace, {
                      message: `Lock not acquired within ${timeoutMSec}ms for key ${String(key)}`,
                      errorCode: 'lock-timeout'
                    })
                  );
                }

                await sleep(this.storeOptions_.retryDelayMSec + Math.random() * this.storeOptions_.retryJitterMSec);
              } else {
                /* node:coverage disable */
                // For other errors, re-throw to be caught by makeAsyncResultFunc
                throw err;
                /* node:coverage enable */
              }
            }
          }
        }
      ),
      release: makeAsyncResultFunc(
        [import.meta.filename, 'release'],
        async (trace, token: LockToken) => await store.releaseLockFile_(trace, lockFile, key, token)
      )
    };
  }

  private releaseLockFile_ = makeAsyncResultFunc(
    [import.meta.filename, 'releaseLockFile_'],
    async (_trace, lockFile: string, key: KeyT, token: LockToken): PR<undefined> => {
      const held = this.heldLocks_.get(token);
      /* node:coverage disable */
      if (held?.key !== key) {
        return makeSuccess(undefined); // Nothing to do / wrong key (ignoring)
      }
      /* node:coverage enable */

      this.heldLocks_.delete(token);
      clearTimeout(held.autoReleaseTimeout);

      await fs.unlink(lockFile).catch(() => {});

      return makeSuccess(undefined);
    }
  );
}
