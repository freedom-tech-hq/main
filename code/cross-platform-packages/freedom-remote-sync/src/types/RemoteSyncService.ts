import type { PRFunc, RFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { DevLoggingSupport } from 'freedom-dev-logging-support';
import type { Notifiable } from 'freedom-notification-types';
import type { PullItem, RemoteAccessor, RemoteId, SyncablePath, SyncGlob } from 'freedom-sync-types';

import type { GetSyncStrategyForPathFunc } from './GetSyncStrategyForPathFunc.ts';
import type { RemoteSyncLogEntry } from './RemoteSyncLogEntry.ts';
import type { ShouldPullFromRemoteFunc } from './ShouldPullFromRemoteFunc.ts';
import type { ShouldPushToRemoteFunc } from './ShouldPushToRemoteFunc.ts';
import type { SyncStrategy } from './SyncStrategy.ts';

/** If `glob` is defined, it always takes precedence over `strategy`.  If `strategy` is `undefined`, it will be determined using
 * `syncService.getSyncStrategyForPath` */
export interface SyncServicePushPullArgs {
  remoteId?: RemoteId;
  basePath: SyncablePath;
  glob?: SyncGlob;
  strategy?: SyncStrategy;
}

export type RemoteSyncServiceNotifications = {
  start: { syncService: RemoteSyncService };
  stop: { syncService: RemoteSyncService };
  pause: { syncService: RemoteSyncService };
  resume: { syncService: RemoteSyncService };
};

export interface RemoteSyncService extends Notifiable<RemoteSyncServiceNotifications> {
  readonly remoteAccessors: Partial<Record<RemoteId, RemoteAccessor>>;

  readonly getSyncStrategyForPath: GetSyncStrategyForPathFunc;
  /** Should return `true` if the specified content should be pulled from the specified remote */
  readonly shouldPullFromRemote: ShouldPullFromRemoteFunc;
  /** Should return `true` if the specified content should be pushed to the specified remote */
  readonly shouldPushToRemote: ShouldPushToRemoteFunc;

  /** If `glob` is defined, it always takes precedence over `strategy`.  If `strategy` is `undefined`, it will be determined using
   * `syncService.getSyncStrategyForPath` */
  readonly enqueuePullFromRemotes: RFunc<
    undefined,
    never,
    [SyncServicePushPullArgs & { hash?: Sha256Hash; priority?: 'default' | 'high' }]
  >;
  /** If `glob` is defined, it always takes precedence over `strategy`.  If `strategy` is `undefined`, it will be determined using
   * `syncService.getSyncStrategyForPath` */
  readonly enqueuePushToRemotes: RFunc<undefined, never, [SyncServicePushPullArgs & { hash?: Sha256Hash; priority?: 'default' | 'high' }]>;
  /** If `glob` is defined, it always takes precedence over `strategy`.  If `strategy` is `undefined`, it will be determined using
   * `syncService.getSyncStrategyForPath` */
  readonly pullFromRemotes: PRFunc<PullItem, 'not-found', [SyncServicePushPullArgs]>;
  /** If `glob` is defined, it always takes precedence over `strategy`.  If `strategy` is `undefined`, it will be determined using
   * `syncService.getSyncStrategyForPath` */
  readonly pushToRemotes: PRFunc<PullItem, 'not-found', [SyncServicePushPullArgs]>;

  readonly areQueuesEmpty: () => boolean;
  readonly start: PRFunc<undefined, never, [options?: { maxPushConcurrency?: number; maxPullConcurrency?: number }]>;
  readonly stop: PRFunc<undefined>;
  /** Temporarily pauses the queues.  Retuns a function to unpause.  More than one pause request can occur simultaneously but unpausing must
   * be done symmetrically (only when there are 0 pauses outstanding will the the queues resume). */
  readonly pause: () => () => void;

  readonly devLogging: DevLoggingSupport<RemoteSyncLogEntry>;
}
