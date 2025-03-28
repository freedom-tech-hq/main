import type { PRFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { SyncableItemMetadata, SyncableItemType, SyncablePath } from 'freedom-sync-types';

export interface SyncableItemAccessorBase {
  readonly type: SyncableItemType;

  readonly path: SyncablePath;

  /** Gets the hash of this file */
  readonly getHash: PRFunc<Sha256Hash, never, [{ recompute?: boolean }?]>;

  /** Gets the metadata */
  readonly getMetadata: PRFunc<SyncableItemMetadata>;

  /** Marks this file as needing its hash to be recomputed */
  readonly markNeedsRecomputeHash: PRFunc<undefined>;
}
