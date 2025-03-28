import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Sha256Hash, Uuid } from 'freedom-basic-data';
import type { TrustedTimeName } from 'freedom-crypto-data';
import type { SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { generateTrustedTimeName } from './generateTrustedTimeName.ts';

export const generateTrustedTimeNameForSyncable = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { path, uuid, getSha256ForItemProvenance }: { path: SyncablePath; uuid: Uuid; getSha256ForItemProvenance: PRFunc<Sha256Hash> }
  ): PR<TrustedTimeName> => {
    const contentHash = await getSha256ForItemProvenance(trace);
    if (!contentHash.ok) {
      return contentHash;
    }

    return await generateTrustedTimeName(trace, store, { path, uuid, contentHash: contentHash.value });
  }
);
