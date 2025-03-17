import type { PRFunc } from 'freedom-async';

export interface BundleManagement {
  /** Finally removes files and/or folders marked for deletion.  This may be all marked files or a selection, depending on file store
   * settings, potentially including retention settings. */
  readonly sweep: PRFunc<undefined>;
}
