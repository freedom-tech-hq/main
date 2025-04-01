import type { SyncableId } from '../types/SyncableId.ts';
import type { SyncableItemType } from '../types/SyncableItemType.ts';
import { extractSyncableIdParts } from './extractSyncableIdParts.ts';

export const extractSyncableItemTypeFromId = (id: SyncableId): SyncableItemType => extractSyncableIdParts(id).type;
