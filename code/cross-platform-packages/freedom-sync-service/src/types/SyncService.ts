import type { PRFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { DevLoggingSupport } from 'freedom-dev-logging-support';
import type { RemoteAccessor, RemoteId, SyncablePath } from 'freedom-sync-types';

import type { GetSyncStrategyForPathFunc } from './GetSyncStrategyForPathFunc.ts';
import type { ShouldSyncWithAllRemotesFunc } from './ShouldSyncWithAllRemotesFunc.ts';
import type { SyncServiceLogEntry } from './SyncServiceLogEntry.ts';

export interface SyncService {
  readonly remoteAccessors: Partial<Record<RemoteId, RemoteAccessor>>;

  /** Should return `true` if the specified content should be pushed to all remotes rather than stopping on the first successful push */
  readonly shouldSyncWithAllRemotes: ShouldSyncWithAllRemotesFunc;
  readonly getSyncStrategyForPath: GetSyncStrategyForPathFunc;

  readonly pullFromRemotes: (args: { remoteId?: RemoteId; path: SyncablePath; hash?: Sha256Hash }) => void;
  readonly pushToRemotes: (args: { remoteId?: RemoteId; path: SyncablePath; hash: Sha256Hash }) => void;

  readonly areQueuesEmpty: () => boolean;
  readonly start: PRFunc<undefined, never, [options?: { maxPushConcurrency?: number; maxPullConcurrency?: number }]>;
  readonly stop: PRFunc<undefined>;

  readonly devLogging: DevLoggingSupport<SyncServiceLogEntry>;
}
