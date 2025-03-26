import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generateSha256HashForEmptyString } from 'freedom-crypto';

import type { SyncableItemAccessor } from '../types/SyncableItemAccessor.ts';

export const getSha256HashForItemProvenance = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, item: SyncableItemAccessor): PR<Sha256Hash> => {
    switch (item.type) {
      case 'folder':
      case 'bundleFile':
        return await generateSha256HashForEmptyString(trace);
      case 'flatFile':
        return await item.getHash(trace);
    }
  }
);
