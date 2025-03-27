import type { PRFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { StaticSyncablePath, SyncableItemType, SyncableProvenance } from 'freedom-sync-types';

export interface SyncableItemAccessorBase {
  readonly type: SyncableItemType;

  readonly path: StaticSyncablePath;

  /** Gets the hash of this file */
  readonly getHash: PRFunc<Sha256Hash, never, [{ recompute?: boolean }?]>;

  /** Gets the provenance of this file */
  readonly getProvenance: PRFunc<SyncableProvenance>;

  /** Marks this file as needing its hash to be recomputed */
  readonly markNeedsRecomputeHash: PRFunc<undefined>;
}
