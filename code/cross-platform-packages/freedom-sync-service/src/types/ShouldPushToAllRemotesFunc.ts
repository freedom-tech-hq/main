import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';
import type { TypeOrPromisedType } from 'yaschema';

export type ShouldPushToAllRemotesFunc = (args: { store: SyncableStore; path: SyncablePath }) => TypeOrPromisedType<boolean>;
