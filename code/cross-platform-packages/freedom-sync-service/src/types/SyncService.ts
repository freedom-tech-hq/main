import type { PRFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { DevLoggingSupport } from 'freedom-dev-logging-support';
import type { RemoteAccessor, RemoteId, SyncablePath } from 'freedom-sync-types';

import type { ShouldSyncWithAllRemotesFunc } from './ShouldSyncWithAllRemotesFunc.ts';
import type { SyncServiceLogEntry } from './SyncServiceLogEntry.ts';

export interface SyncService {
  readonly getRemotesAccessors: () => Partial<Record<RemoteId, RemoteAccessor>>;
  readonly shouldSyncWithAllRemotes: ShouldSyncWithAllRemotesFunc;

  readonly pullFromRemotes: (args: { path: SyncablePath; hash?: Sha256Hash }) => void;

  readonly pushToRemotes: (args: { path: SyncablePath; hash: Sha256Hash }) => void;

  readonly areQueuesEmpty: () => boolean;
  readonly start: PRFunc<undefined, never, [options?: { maxPushConcurrency?: number; maxPullConcurrency?: number }]>;
  readonly stop: PRFunc<undefined>;

  readonly devLogging: DevLoggingSupport<SyncServiceLogEntry>;
}
