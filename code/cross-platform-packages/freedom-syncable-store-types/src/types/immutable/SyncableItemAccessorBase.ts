import type { PRFunc } from 'freedom-async';
import type { LocalItemMetadata, SyncableItemMetadata, SyncablePath } from 'freedom-sync-types';

export interface SyncableItemAccessorBase {
  readonly path: SyncablePath;

  /** Gets the metadata */
  readonly getMetadata: PRFunc<SyncableItemMetadata & LocalItemMetadata>;

  /** Gets the decrypted name */
  readonly getName: PRFunc<string>;

  /** Marks this file as needing its hash to be recomputed */
  readonly markNeedsRecomputeLocalMetadata: PRFunc<undefined>;
}
