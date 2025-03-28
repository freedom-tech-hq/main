import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SignedSyncableOrigin, SyncableItemName, SyncableItemType, SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { generateOrigin } from './generateOrigin.ts';

export const generateOriginForFolderLikeItemAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { path, type, name }: { path: SyncablePath; type: SyncableItemType; name: SyncableItemName }
  ): PR<SignedSyncableOrigin> =>
    await generateOrigin(trace, { path, type, name, contentHash: undefined, cryptoService: store.cryptoService })
);
