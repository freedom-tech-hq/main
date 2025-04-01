import type { SyncableId, UnmarkedSyncableId } from '../types/SyncableId.ts';
import { extractSyncableIdParts } from './extractSyncableIdParts.ts';

export const extractUnmarkedSyncableId = (id: SyncableId): UnmarkedSyncableId => extractSyncableIdParts(id).unmarkedId;
