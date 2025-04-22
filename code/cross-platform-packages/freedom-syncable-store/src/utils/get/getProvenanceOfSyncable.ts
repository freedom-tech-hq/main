import type { ChainableResult, PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, resolveChain } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SyncableProvenance } from 'freedom-sync-types';
import { SyncablePath } from 'freedom-sync-types';
import type { SyncableItemAccessor, SyncableStore } from 'freedom-syncable-store-types';

import { getSyncableAtPath } from './getSyncableAtPath.ts';

export const getProvenanceOfSyncable = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: SyncableStore,
    pathOrAccessor: SyncablePath | ChainableResult<SyncableItemAccessor, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'>
  ): PR<SyncableProvenance, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const item = await (pathOrAccessor instanceof SyncablePath
      ? getSyncableAtPath(trace, store, pathOrAccessor)
      : resolveChain(pathOrAccessor));
    if (!item.ok) {
      return item;
    }

    const metadata = await item.value.getMetadata(trace);
    if (!metadata.ok) {
      return metadata;
    }

    return makeSuccess(metadata.value.provenance);
  }
);
