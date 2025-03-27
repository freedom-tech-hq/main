import type { StaticSyncablePath } from 'freedom-sync-types';

import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';

export abstract class DefaultMutableFileAccessorBase {
  public abstract type: 'bundle' | 'flatFile';
  public readonly path: StaticSyncablePath;

  protected readonly weakStore_: WeakRef<MutableSyncableStore>;

  constructor({ store, path }: { store: WeakRef<MutableSyncableStore>; path: StaticSyncablePath }) {
    this.weakStore_ = store;
    this.path = path;
  }
}
