import type { RemoteId, SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';
import type { TypeOrPromisedType } from 'yaschema';

export type ShouldPullFromRemoteFunc = (args: {
  store: SyncableStore;
  remoteId: RemoteId;
  path: SyncablePath;
}) => TypeOrPromisedType<boolean>;
