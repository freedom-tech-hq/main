import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncPullArgs, SyncPullResponse } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

import { getSyncableItemTypeAtPathForSync } from '../sync/getSyncableItemTypeAtPathForSync.ts';
import { pullBundle } from './pullBundle.ts';
import { pullFile } from './pullFile.ts';
import { pullFolder } from './pullFolder.ts';

export const pullPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, args: SyncPullArgs): PR<SyncPullResponse, 'not-found'> => {
    const itemType = await getSyncableItemTypeAtPathForSync(trace, store, args.path);
    if (!itemType.ok) {
      return itemType;
    }

    switch (itemType.value) {
      case 'folder':
        return await pullFolder(trace, store, args);

      case 'file':
        return await pullFile(trace, store, args);

      case 'bundle':
        return await pullBundle(trace, store, args);
    }
  },
  // This will commonly be not-found if the service doesn't yet have the data
  { deepDisableLam: 'not-found' }
);
