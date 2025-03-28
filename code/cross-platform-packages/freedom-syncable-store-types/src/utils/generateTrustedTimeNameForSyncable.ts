import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Sha256Hash, Uuid } from 'freedom-basic-data';
import type { TrustedTimeName } from 'freedom-crypto-data';
import type { OldSyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { generateTrustedTimeName } from './generateTrustedTimeName.ts';

export const generateTrustedTimeNameForSyncable = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    {
      parentPath,
      uuid,
      getSha256ForItemProvenance
    }: { parentPath: OldSyncablePath; uuid: Uuid; getSha256ForItemProvenance: PRFunc<Sha256Hash> }
  ): PR<TrustedTimeName> => {
    const contentHash = await getSha256ForItemProvenance(trace);
    if (!contentHash.ok) {
      return contentHash;
    }

    return await generateTrustedTimeName(trace, store, { parentPath, uuid, contentHash: contentHash.value });
  }
);
