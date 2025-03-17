import type { PR, PRFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { MutableIndexStore } from 'freedom-indexing-types';
import type { LockStore } from 'freedom-locking-types';
import type { MutableObjectStore } from 'freedom-object-store-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { GetOrCreateIndexStoreArgs } from './GetOrCreateIndexStoreArgs.ts';
import type { GetOrCreateLockStoreArgs } from './GetOrCreateLockStoreArgs.ts';
import type { GetOrCreateObjectStoreArgs } from './GetOrCreateObjectStoreArgs.ts';
import type { GetOrCreateSyncableStoreArgs } from './GetOrCreateSyncableStoreArgs.ts';

/** Configurations and schemas are assumed to be stable for a given `id` + `version` combination */
export interface DataSources {
  // TODO: need to deal with the possibility of data migrations
  /** Gets or creates a standalone index store. */
  getOrCreateIndexStore: <KeyT extends string, IndexedValueT>(
    trace: Trace,
    args: GetOrCreateIndexStoreArgs<KeyT, IndexedValueT>
  ) => PR<MutableIndexStore<KeyT, IndexedValueT>>;

  /** Gets or creates a standalone lock store. */
  getOrCreateLockStore: <KeyT extends string>(trace: Trace, args: GetOrCreateLockStoreArgs<KeyT>) => PR<LockStore<KeyT>>;

  // TODO: need to deal with the possibility of data migrations
  /** Gets or creates a standalone file system-like syncable store. */
  getOrCreateSyncableStore: PRFunc<MutableSyncableStore, never, [args: GetOrCreateSyncableStoreArgs]>;

  // TODO: need to deal with the possibility of data migrations
  /** Gets or creates a standalone object store. */
  getOrCreateObjectStore: <KeyT extends string, T>(
    trace: Trace,
    args: GetOrCreateObjectStoreArgs<KeyT, T>
  ) => PR<MutableObjectStore<KeyT, T>>;

  // TODO: need to deal with the possibility of data migrations
  /** Gets or creates a standalone object store suitable for storing secrets. */
  getOrCreateSecretStore: <KeyT extends string, T>(
    trace: Trace,
    args: GetOrCreateObjectStoreArgs<KeyT, T>
  ) => PR<MutableObjectStore<KeyT, T>>;
}
