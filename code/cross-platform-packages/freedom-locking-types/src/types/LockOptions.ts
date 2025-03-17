export interface LockOptions {
  /**
   * If a lock isn't acquired within this time, the attempt fails with a timeout error.
   *
   * @defaultValue `DEFAULT_LOCK_TIMEOUT_MSEC` (1 minute)
   */
  timeoutMSec?: number;

  /**
   * If a lock is held longer than this time, it's automatically released.
   *
   * @defaultValue `DEFAULT_LOCK_AUTO_RELEASE_AFTER_MSEC` (10 minutes)
   */
  autoReleaseAfterMSec?: number;
}
