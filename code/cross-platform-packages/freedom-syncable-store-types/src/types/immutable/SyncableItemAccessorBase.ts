import type { PRFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { SyncableItemMetadata, SyncableItemType, SyncablePath } from 'freedom-sync-types';

export interface SyncableItemAccessorBase {
  readonly type: SyncableItemType;

  readonly path: SyncablePath;

  /** Checks if the item is marked as deleted.  If `recursive` is `true`, also checks the item's ancestors. */
  readonly isDeleted: PRFunc<boolean, never, [{ recursive: boolean }]>;

  /** Gets the hash of this file */
  readonly getHash: PRFunc<Sha256Hash>;

  /** Gets the metadata */
  readonly getMetadata: PRFunc<SyncableItemMetadata>;

  /** Marks this file as needing its hash to be recomputed */
  readonly markNeedsRecomputeHash: PRFunc<undefined>;
}
