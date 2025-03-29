import type { PRFunc } from 'freedom-async';
import type { SyncableItemMetadata } from 'freedom-sync-types';

import type { FileStore } from './FileStore.ts';
import type { SyncableItemAccessorBase } from './SyncableItemAccessorBase.ts';

export interface SyncableBundleAccessor extends SyncableItemAccessorBase, FileStore {
  readonly type: 'bundle';

  /** Gets the metadata */
  readonly getMetadata: PRFunc<SyncableItemMetadata>;
}
