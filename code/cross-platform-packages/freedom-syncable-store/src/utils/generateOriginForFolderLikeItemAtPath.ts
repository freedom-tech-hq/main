import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SignedSyncableOrigin, SyncableItemName, SyncableItemType, SyncableOriginOptions, SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { generateOrigin } from './generateOrigin.ts';

export const generateOriginForFolderLikeItemAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    {
      path,
      type,
      name,
      trustedTimeSignature
    }: SyncableOriginOptions & { path: SyncablePath; type: SyncableItemType; name: SyncableItemName }
  ): PR<SignedSyncableOrigin> =>
    await generateOrigin(trace, { path, type, name, contentHash: undefined, trustedTimeSignature, cryptoService: store.cryptoService })
);
