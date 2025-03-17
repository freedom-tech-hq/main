import type { LockStore } from '../types/LockStore.ts';

export const makePrefixedKeyLockStore = <KeyPrefixT extends string, KeyT extends string>(
  prefix: KeyPrefixT,
  lockStore: LockStore<`${KeyPrefixT}${KeyT}`>
): LockStore<KeyT> => ({
  uid: JSON.stringify({ prefixedKeyLockStoreUid: lockStore.uid, prefix }),

  lock: (key: KeyT) => lockStore.lock(`${prefix}${key}`)
});
