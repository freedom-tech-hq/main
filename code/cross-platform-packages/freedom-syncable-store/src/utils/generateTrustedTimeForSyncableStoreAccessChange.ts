import type { AccessChange } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStore, SyncableStoreRole } from 'freedom-syncable-store-types';
import type { TrustedTime } from 'freedom-trusted-time-source';

import { generateContentHashForSyncableStoreAccessChange } from './generateContentHashForSyncableStoreAccessChange.ts';
import { generateTrustedTime } from './generateTrustedTime.ts';

export const generateTrustedTimeForSyncableStoreAccessChange = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { parentPath, accessChange }: { parentPath: SyncablePath; accessChange: AccessChange<SyncableStoreRole> }
  ): PR<TrustedTime> => {
    const contentHash = await generateContentHashForSyncableStoreAccessChange(trace, accessChange);
    if (!contentHash.ok) {
      return contentHash;
    }

    return await generateTrustedTime(trace, store, { parentPath, contentHash: contentHash.value });
  }
);
