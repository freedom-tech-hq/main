import type { StaticSyncablePath } from 'freedom-sync-types';

import type { SyncableStoreBacking } from '../../types/backing/SyncableStoreBacking.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';

// TODO: rename to DefaultMutableFileAccessorBase in separate PR
export abstract class InMemoryMutableFileAccessorBase {
  public abstract type: 'bundleFile' | 'flatFile';
  public readonly path: StaticSyncablePath;

  protected readonly weakStore_: WeakRef<MutableSyncableStore>;
  protected readonly backing_: SyncableStoreBacking;

  constructor({ store, backing, path }: { store: WeakRef<MutableSyncableStore>; backing: SyncableStoreBacking; path: StaticSyncablePath }) {
    this.weakStore_ = store;
    this.backing_ = backing;
    this.path = path;
  }
}
