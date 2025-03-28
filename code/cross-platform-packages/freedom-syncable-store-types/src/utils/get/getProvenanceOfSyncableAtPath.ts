import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { OldSyncablePath, SyncableProvenance } from 'freedom-sync-types';

import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getSyncableAtPath } from './getSyncableAtPath.ts';

export const getProvenanceOfSyncableAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: SyncableStore,
    path: OldSyncablePath
  ): PR<SyncableProvenance, 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const item = await getSyncableAtPath(trace, store, path);
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
