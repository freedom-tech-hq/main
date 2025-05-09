import type { SyncablePath } from 'freedom-sync-types';
import type { TypeOrPromisedType } from 'yaschema';

import type { SyncStrategy } from './SyncStrategy.ts';

export type GetSyncStrategyForPathFunc = (direction: 'push' | 'pull', path: SyncablePath) => TypeOrPromisedType<SyncStrategy>;
