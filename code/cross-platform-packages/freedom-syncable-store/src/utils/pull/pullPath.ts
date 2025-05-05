import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { SyncPullArgs, SyncPullResponse } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { getSyncableAtPath } from '../get/getSyncableAtPath.ts';
import { pullBundle } from './pullBundle.ts';
import { pullFile } from './pullFile.ts';
import { pullFolder } from './pullFolder.ts';

export const pullPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore, args: SyncPullArgs): PR<SyncPullResponse, 'not-found'> => {
    const syncableItem = await disableLam(trace, 'not-found', (trace) => getSyncableAtPath(trace, store, args.path));
    if (!syncableItem.ok) {
      return generalizeFailureResult(trace, syncableItem, ['untrusted', 'wrong-type']);
    }

    switch (syncableItem.value.type) {
      case 'folder':
        return await pullFolder(trace, store, args);

      case 'file':
        return await pullFile(trace, store, args);

      case 'bundle':
        return await pullBundle(trace, store, args);
    }
  },
  // This will commonly be not-found if the service doesn't yet have the data
  { disableLam: 'not-found' }
);
