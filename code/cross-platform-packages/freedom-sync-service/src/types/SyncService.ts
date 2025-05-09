import type { PRFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { DevLoggingSupport } from 'freedom-dev-logging-support';
import type { RemoteAccessor, RemoteId, SyncablePath, SyncablePathPattern } from 'freedom-sync-types';

import type { GetSyncStrategyForPathFunc } from './GetSyncStrategyForPathFunc.ts';
import type { ShouldPullFromRemoteFunc } from './ShouldPullFromRemoteFunc.ts';
import type { ShouldPushToAllRemotesFunc } from './ShouldPushToAllRemotesFunc.ts';
import type { SyncServiceLogEntry } from './SyncServiceLogEntry.ts';

export interface SyncService {
  readonly remoteAccessors: Partial<Record<RemoteId, RemoteAccessor>>;

  readonly getSyncStrategyForPath: GetSyncStrategyForPathFunc;
  /** Should return `true` if the specified content should be pulled from the specified remote */
  readonly shouldPullFromRemote: ShouldPullFromRemoteFunc;
  /** Should return `true` if the specified content should be pushed to all remotes rather than stopping on the first successful push */
  readonly shouldPushToAllRemotes: ShouldPushToAllRemotesFunc;

  readonly pullFromRemotes: (args: { remoteId?: RemoteId; path: SyncablePath; hash?: Sha256Hash; priority?: 'default' | 'high' }) => void;
  readonly pushToRemotes: (args: { remoteId?: RemoteId; path: SyncablePath; hash: Sha256Hash; priority?: 'default' | 'high' }) => void;

  /** @returns a 'not-found' error if the specified `basePath` can't be found */
  readonly immediatelyPullGlobFromRemotes: PRFunc<
    undefined,
    'not-found',
    [
      args: {
        remoteId?: RemoteId;
        basePath: SyncablePath;
        /** glob-like patterns to include */
        include: SyncablePathPattern[];
        /** glob-like patterns to exclude */
        exclude?: SyncablePathPattern[];
      }
    ]
  >;

  readonly areQueuesEmpty: () => boolean;
  readonly start: PRFunc<undefined, never, [options?: { maxPushConcurrency?: number; maxPullConcurrency?: number }]>;
  readonly stop: PRFunc<undefined>;

  readonly devLogging: DevLoggingSupport<SyncServiceLogEntry>;
}
