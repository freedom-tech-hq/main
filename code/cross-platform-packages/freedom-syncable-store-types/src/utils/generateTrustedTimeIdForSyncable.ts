import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Sha256Hash, Uuid } from 'freedom-basic-data';
import type { TrustedTimeId } from 'freedom-crypto-data';
import type { SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { generateTrustedTimeId } from './generateTrustedTimeId.ts';

export const generateTrustedTimeIdForSyncable = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    {
      parentPath,
      uuid,
      getSha256ForItemProvenance
    }: { parentPath: SyncablePath; uuid: Uuid; getSha256ForItemProvenance: PRFunc<Sha256Hash> }
  ): PR<TrustedTimeId> => {
    const contentHash = await getSha256ForItemProvenance(trace);
    if (!contentHash.ok) {
      return contentHash;
    }

    return await generateTrustedTimeId(trace, store, { parentPath, uuid, contentHash: contentHash.value });
  }
);
