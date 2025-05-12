import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { getMetadataAtPath } from 'freedom-syncable-store';
import type { SyncableItemAccessor, SyncableStore } from 'freedom-syncable-store-types';

export const getLocalHashesForItemsByPathString = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, items: SyncableItemAccessor[]): PR<Partial<Record<string, Sha256Hash>>> => {
    const hashesByPathString: Partial<Record<string, Sha256Hash>> = {};
    const gotHashes = await allResultsMapped(trace, items, {}, async (trace, item) => {
      const metadata = await getMetadataAtPath(trace, store, item.path);
      if (!metadata.ok) {
        return metadata;
      }

      hashesByPathString[item.path.toString()] = metadata.value.hash;

      return makeSuccess(undefined);
    });
    if (!gotHashes.ok) {
      return generalizeFailureResult(trace, gotHashes, ['not-found', 'untrusted', 'wrong-type']);
    }

    return makeSuccess(hashesByPathString);
  }
);
