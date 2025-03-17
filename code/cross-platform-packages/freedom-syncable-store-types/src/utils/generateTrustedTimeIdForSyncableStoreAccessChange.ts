import type { AccessChange } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';
import type { TrustedTimeId } from 'freedom-crypto-data';
import type { SyncablePath } from 'freedom-sync-types';
import { StaticSyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import type { SyncableStoreRole } from '../types/SyncableStoreRole.ts';
import { generateContentHashForSyncableStoreAccessChange } from './generateContentHashForSyncableStoreAccessChange.ts';
import { generateTrustedTimeId } from './generateTrustedTimeId.ts';

export const generateTrustedTimeIdForSyncableStoreAccessChange = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { path, accessChange }: { path: SyncablePath; accessChange: AccessChange<SyncableStoreRole> }
  ): PR<TrustedTimeId> => {
    const contentHash = await generateContentHashForSyncableStoreAccessChange(trace, accessChange);
    if (!contentHash.ok) {
      return contentHash;
    }

    const parentPath = path.parentPath ?? new StaticSyncablePath(path.storageRootId);

    return generateTrustedTimeId(trace, store, { parentPath, uuid: makeUuid(), contentHash: contentHash.value });
  }
);
