import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncPushArgs } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { pushBundle } from './pushBundle.ts';
import { pushFile } from './pushFile.ts';
import { pushFolder } from './pushFolder.ts';

export const pushPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: MutableSyncableStore, args: SyncPushArgs): PR<undefined> => {
    switch (args.type) {
      case 'folder':
        return await pushFolder(trace, store, args);

      case 'bundle':
        return await pushBundle(trace, store, args);

      case 'file':
        return await pushFile(trace, store, args);
    }
  }
);
