import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generateSha256HashForEmptyString } from 'freedom-crypto';
import type { SyncableItemAccessor } from 'freedom-syncable-store-types';

export const getSha256HashForItemProvenance = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, item: SyncableItemAccessor): PR<Sha256Hash> => {
    switch (item.type) {
      case 'folder':
      case 'bundle':
        return await generateSha256HashForEmptyString(trace);
      case 'file':
        return await item.getHash(trace);
    }
  }
);
