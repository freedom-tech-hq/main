import type { SyncableItemType } from '../types/SyncableItemType.ts';
import type { SyncablePath } from '../types/SyncablePath.ts';
import { extractSyncableIdParts } from './extractSyncableIdParts.ts';

export const extractSyncableItemTypeFromPath = (path: SyncablePath): SyncableItemType =>
  path.lastId === undefined ? 'folder' : extractSyncableIdParts(path.lastId).type;
