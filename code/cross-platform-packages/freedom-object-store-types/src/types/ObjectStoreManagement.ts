import type { PRFunc } from 'freedom-async';
import type { PageToken, Paginated } from 'freedom-paginated-data';

export interface ObjectStoreManagement<KeyT extends string, _T> {
  /** Gets the keys of objects marked for deletion.  This doesn't include keys for objects that have been finally removed via a sweep. */
  getDeletedKeys: PRFunc<Paginated<KeyT>, never, [pageToken?: PageToken]>;

  /** Finally removes objects marked for deletion.  This may be all marked objects or a selection, depending on object store settings,
   * potentially including retention settings. */
  sweep: PRFunc<KeyT[]>;
}
