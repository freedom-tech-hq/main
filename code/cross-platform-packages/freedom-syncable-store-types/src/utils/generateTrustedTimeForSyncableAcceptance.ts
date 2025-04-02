import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { SyncablePath } from 'freedom-sync-types';
import type { TrustedTime } from 'freedom-trusted-time-source';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { generateTrustedTime } from './generateTrustedTime.ts';

export const generateTrustedTimeForSyncableAcceptance = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { path, getSha256ForItemProvenance }: { path: SyncablePath; getSha256ForItemProvenance: PRFunc<Sha256Hash> }
  ): PR<TrustedTime> => {
    const contentHash = await getSha256ForItemProvenance(trace);
    if (!contentHash.ok) {
      return contentHash;
    }

    // This trusted time will go to the provenance of the item at the path, so the parent path of the trusted time is really the path of the
    // item
    return await generateTrustedTime(trace, store, { parentPath: path, contentHash: contentHash.value });
  }
);
