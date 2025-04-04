import type { SyncableId } from '../types/SyncableId.ts';
import { extractSyncableIdParts } from './extractSyncableIdParts.ts';

export const isSyncableItemEncrypted = (id: SyncableId): boolean => extractSyncableIdParts(id).encrypted;
