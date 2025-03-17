import type { PRFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { RemoteInfo, StaticSyncablePath } from 'freedom-sync-types';

import type { ShouldSyncWithAllRemotesFunc } from './ShouldSyncWithAllRemotesFunc.ts';
import type { SyncServiceLogEntry } from './SyncServiceLogEntry.ts';

export interface SyncService {
  readonly getRemotes: () => RemoteInfo[];
  readonly shouldSyncWithAllRemotes: ShouldSyncWithAllRemotesFunc;

  readonly pullFromRemotes: (args: { path: StaticSyncablePath; hash?: Sha256Hash }) => void;

  readonly pushToRemotes: (args: { path: StaticSyncablePath; hash: Sha256Hash }) => void;

  readonly areQueuesEmpty: () => boolean;
  readonly start: PRFunc<undefined, never, [options?: { maxPushConcurrency?: number; maxPullConcurrency?: number }]>;
  readonly stop: PRFunc<undefined>;

  // Logging Support

  readonly setShouldRecordLogs: (shouldRecord: boolean) => void;
  readonly isRecordingLogs: () => boolean;
  readonly appendLogEntry: ((entry: SyncServiceLogEntry) => void) | undefined;
  readonly getLogEntries: () => SyncServiceLogEntry[];
  readonly clearLogEntries: () => void;
}
