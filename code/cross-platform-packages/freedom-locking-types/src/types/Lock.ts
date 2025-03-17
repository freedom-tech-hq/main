import type { PRFunc } from 'freedom-async';

import type { LockOptions } from './LockOptions.ts';
import type { LockToken } from './LockToken.ts';

export interface Lock {
  /**
   * Attempts to acquire this lock.
   *
   * Defaults:
   *
   * - `timeoutMSec` = `DEFAULT_LOCK_TIMEOUT_MSEC` (1 minute)
   * - `autoReleaseAfterMSec` = `DEFAULT_LOCK_AUTO_RELEASE_AFTER_MSEC` (10 minutes)
   */
  acquire: PRFunc<LockToken, 'lock-timeout', [options?: LockOptions]>;

  /** Releases the lock using the specified token.  If the token is invalid or already released, this does nothing. */
  release: PRFunc<undefined, never, [token: LockToken]>;
}
