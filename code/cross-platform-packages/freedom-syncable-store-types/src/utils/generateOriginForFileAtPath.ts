import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { SignedSyncableOrigin, SyncableItemName, SyncableItemType, SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { generateOrigin } from './generateOrigin.ts';

export const generateOriginForFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    {
      path,
      type,
      name,
      getSha256ForItemProvenance
    }: { path: SyncablePath; type: SyncableItemType; name: SyncableItemName; getSha256ForItemProvenance: PRFunc<Sha256Hash> }
  ): PR<SignedSyncableOrigin> => {
    const contentHash = await getSha256ForItemProvenance(trace);
    if (!contentHash.ok) {
      return contentHash;
    }

    return await generateOrigin(trace, { path, type, name, contentHash: contentHash.value, cryptoService: store.cryptoService });
  }
);
