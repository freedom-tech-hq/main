import type { SyncablePath, SyncStrategy } from 'freedom-sync-types';
import type { TypeOrPromisedType } from 'yaschema';

export type GetSyncStrategyForPathFunc = (direction: 'push' | 'pull', path: SyncablePath) => TypeOrPromisedType<SyncStrategy>;
