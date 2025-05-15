import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import { promises as fs } from 'fs';
import * as path from 'path';

import { DEFAULT_LOCK_AUTO_RELEASE_AFTER_MSEC, DEFAULT_LOCK_TIMEOUT_MSEC } from '../consts/timeout.ts';
import type { Lock } from './Lock.ts';
import type { LockOptions } from './LockOptions.ts';
import type { LockStore } from './LockStore.ts';
import type { LockToken } from './LockToken.ts';
import { lockTokenInfo } from './LockToken.ts';

// Helper: sleep for ms
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface FileLockInfo {
  token: LockToken;
  timeout?: NodeJS.Timeout;
}

export class FileLockStore<KeyT extends string> implements LockStore<KeyT> {
  public readonly uid = makeUuid();
  private readonly dir: string;
  private readonly heldLocks = new Map<KeyT, FileLockInfo>();

  constructor(dir: string) {
    this.dir = dir;
  }

  public lock(key: KeyT): Lock {
    const lockFile = path.join(this.dir, `${key}.lock`);
    const store = this;

    return {
      uid: `${this.uid}.${key}`,
      acquire: makeAsyncResultFunc(
        [import.meta.filename, 'acquire'],
        async (
          _trace,
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
              let timeout: NodeJS.Timeout | undefined;
              if (autoReleaseAfterMSec && autoReleaseAfterMSec > 0) {
                timeout = setTimeout(async () => {
                  await store.releaseLockFile(lockFile, key, token);
                }, autoReleaseAfterMSec);
              }
              store.heldLocks.set(key, { token, timeout });
              return makeSuccess(token);
            } catch (err) {
              // Check if it's an error object with a 'code' property
              if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'EEXIST') {
                // File exists: someone else holds the lock
                if (Date.now() - start > timeoutMSec) {
                  return makeFailure(
                    new InternalStateError(_trace, {
                      message: `Lock not acquired within ${timeoutMSec}ms for key ${String(key)}`,
                      errorCode: 'lock-timeout'
                    })
                  );
                }
                await sleep(20); // Retry
              } else {
                // For other errors, re-throw to be caught by makeAsyncResultFunc
                throw err;
              }
            }
          }
        }
      ),
      release: makeAsyncResultFunc([import.meta.filename, 'release'], async (_trace, token: LockToken) => {
        const held = store.heldLocks.get(key);
        if (!held || held.token !== token) {
          return makeSuccess(undefined); // Wrong token or not held
        }
        await store.releaseLockFile(lockFile, key, token);
        return makeSuccess(undefined);
      })
    };
  }

  private async releaseLockFile(lockFile: string, key: KeyT, token: LockToken) {
    const held = this.heldLocks.get(key);
    if (!held || held.token !== token) return;
    this.heldLocks.delete(key);
    if (held.timeout) clearTimeout(held.timeout);
    await fs.unlink(lockFile).catch(() => {});
  }
}
