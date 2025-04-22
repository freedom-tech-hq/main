import type { SyncablePath } from 'freedom-sync-types';

export interface MutableTrustMarkStore {
  /** Determines if the specified ID for the specified path is marked as being trusted */
  readonly isTrusted: (path: SyncablePath, markId: string) => boolean;

  /** Marks the specified ID for the specified path as being trusted */
  readonly markTrusted: (path: SyncablePath, markId: string) => void;

  /** Clears trust for the specified path and optionally ID.  If an ID isn't specified, this clears all sub-paths recursively as well. */
  readonly clearTrust: (path: SyncablePath, markId?: string) => void;
}
