import type { PRFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { StaticSyncablePath, SyncableProvenance } from 'freedom-sync-types';

export interface FileAccessorBase {
  readonly type: 'flatFile' | 'bundle';

  readonly path: StaticSyncablePath;

  /** Gets the hash of this file */
  readonly getHash: PRFunc<Sha256Hash, never, [{ recompute?: boolean }?]>;

  /** Marks this file as needing its hash to be recomputed */
  readonly markNeedsRecomputeHash: PRFunc<undefined>;

  /** Gets the provenance of this file */
  readonly getProvenance: PRFunc<SyncableProvenance>;
}
