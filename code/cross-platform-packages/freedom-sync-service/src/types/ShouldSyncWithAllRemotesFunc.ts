import type { PRFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import type { StaticSyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';

export type ShouldSyncWithAllRemotesFunc = PRFunc<
  boolean,
  'not-found',
  [{ store: SyncableStore; path: StaticSyncablePath; hash: Sha256Hash }]
>;
