import type { Lock } from './Lock.ts';

export interface LockStore<KeyT extends string> {
  uid: string;

  /** Gets an accessor to the lock with the specified key.  The existence of the lock isn't checked. */
  lock: (key: KeyT) => Lock;
}
