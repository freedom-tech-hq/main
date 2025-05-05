import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { SyncPushArgs } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { pushBundle } from './pushBundle.ts';
import { pushFile } from './pushFile.ts';
import { pushFolder } from './pushFolder.ts';

export const pushPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: MutableSyncableStore, args: SyncPushArgs): PR<undefined, 'not-found'> =>
    await disableLam(trace, 'not-found', async (trace) => {
      switch (args.type) {
        case 'folder':
          return await pushFolder(trace, store, args);

        case 'bundle':
          return await pushBundle(trace, store, args);

        case 'file':
          return await pushFile(trace, store, args);
      }
    }),
  // 'not-found' happens during push fairly commonly when doing an initial sync to a server and simultaneously updating the client, because
  // the client will try to push newer content before the base folders have been initially pushed -- but this will automatically get
  // resolved as the initial sync continues
  { disableLam: 'not-found' }
);
