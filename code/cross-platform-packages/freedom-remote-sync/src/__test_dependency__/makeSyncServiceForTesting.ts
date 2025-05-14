import type { PR } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { pullFromLocal, pushToLocal } from 'freedom-local-sync';
import type { PullItem } from 'freedom-sync-types';
import { remoteIdInfo } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { GetSyncStrategyForPathFunc } from '../types/GetSyncStrategyForPathFunc.ts';
import type { ShouldPullFromRemoteFunc } from '../types/ShouldPullFromRemoteFunc.ts';
import type { ShouldPushToRemoteFunc } from '../types/ShouldPushToRemoteFunc.ts';
import { makeSyncService } from '../utils/makeSyncService.ts';

export const makeSyncServiceForTesting = ({
  localTrace,
  localStore,
  remoteTrace,
  remoteStore,
  getSyncStrategyForPath,
  shouldPullFromRemote,
  shouldPushToRemote
}: {
  localTrace: Trace;
  localStore: MutableSyncableStore;
  remoteTrace: Trace;
  remoteStore: MutableSyncableStore;
  getSyncStrategyForPath: GetSyncStrategyForPathFunc;
  shouldPullFromRemote: ShouldPullFromRemoteFunc;
  shouldPushToRemote: ShouldPushToRemoteFunc;
}) => {
  return makeSyncService(localTrace, {
    remoteConnections: [
      {
        accessor: {
          remoteId: remoteIdInfo.make('test'),
          puller: async (_trace, { basePath, localHashesRelativeToBasePath, glob, sendData = false }): PR<PullItem, 'not-found'> =>
            await pullFromLocal(remoteTrace, remoteStore, { basePath, localHashesRelativeToBasePath, glob, sendData }),
          pusher: async (_trace, { basePath, item }): PR<PullItem, 'not-found'> =>
            await pushToLocal(remoteTrace, remoteStore, { basePath, item })
        },
        changeNotificationClient: { addListener: () => () => {} }
      }
    ],
    store: localStore,
    shouldRecordLogs: true,
    getSyncStrategyForPath,
    shouldPullFromRemote,
    shouldPushToRemote
  });
};
