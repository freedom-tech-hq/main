import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SyncableItemType, SyncablePath, SyncablePathPattern } from 'freedom-sync-types';
import type { SyncableItemAccessor, SyncableStore } from 'freedom-syncable-store-types';
import type { SingleOrArray } from 'yaschema';

export const findSyncables = makeAsyncResultFunc(
  [import.meta.filename],
  async <T extends SyncableItemType = SyncableItemType>(
    trace: Trace,
    store: SyncableStore,
    {
      basePath,
      include,
      exclude,
      type
    }: { basePath: SyncablePath; include: SyncablePathPattern[]; exclude?: SyncablePathPattern[]; type?: SingleOrArray<T> }
  ): PR<Array<SyncableItemAccessor & { type: T }>> => {
    // TODO: implement this method.  it should find items in the store that match any of the specified include patterns and that do not
    // match any of the specified exclude patterns.  See SyncablePathPattern.  It uses a glob-like '**' indicator to mean any item at any
    // depth and '*' to mean any item at the current depth.  Ignore the type argument for now.
  }
);
