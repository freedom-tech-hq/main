import type { AccessChange } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';
import type { TrustedTimeName } from 'freedom-crypto-data';
import type { SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import type { SyncableStoreRole } from '../types/SyncableStoreRole.ts';
import { generateContentHashForSyncableStoreAccessChange } from './generateContentHashForSyncableStoreAccessChange.ts';
import { generateTrustedTimeName } from './generateTrustedTimeName.ts';

export const generateTrustedTimeNameForSyncableStoreAccessChange = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { path, accessChange }: { path: SyncablePath; accessChange: AccessChange<SyncableStoreRole> }
  ): PR<TrustedTimeName> => {
    const contentHash = await generateContentHashForSyncableStoreAccessChange(trace, accessChange);
    if (!contentHash.ok) {
      return contentHash;
    }

    return await generateTrustedTimeName(trace, store, { path, uuid: makeUuid(), contentHash: contentHash.value });
  }
);
