import type { AccessChange } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';
import type { TrustedTimeName } from 'freedom-crypto-data';
import type { OldSyncablePath } from 'freedom-sync-types';
import { SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import type { SyncableStoreRole } from '../types/SyncableStoreRole.ts';
import { generateContentHashForSyncableStoreAccessChange } from './generateContentHashForSyncableStoreAccessChange.ts';
import { generateTrustedTimeName } from './generateTrustedTimeName.ts';

export const generateTrustedTimeNameForSyncableStoreAccessChange = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { path, accessChange }: { path: OldSyncablePath; accessChange: AccessChange<SyncableStoreRole> }
  ): PR<TrustedTimeName> => {
    const contentHash = await generateContentHashForSyncableStoreAccessChange(trace, accessChange);
    if (!contentHash.ok) {
      return contentHash;
    }

    const parentPath = path.parentPath ?? new SyncablePath(path.storageRootId);

    return await generateTrustedTimeName(trace, store, { parentPath, uuid: makeUuid(), contentHash: contentHash.value });
  }
);
