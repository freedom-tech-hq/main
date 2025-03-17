import type { DynamicSyncablePath } from './DynamicSyncablePath.ts';
import type { StaticSyncablePath } from './StaticSyncablePath.ts';

export type SyncablePath = StaticSyncablePath | DynamicSyncablePath;
