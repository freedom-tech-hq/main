import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
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
      case 'file': {
        const metadata = await item.getMetadata(trace);
        if (!metadata.ok) {
          return metadata;
        }

        return makeSuccess(metadata.value.hash);
      }
    }
  }
);
