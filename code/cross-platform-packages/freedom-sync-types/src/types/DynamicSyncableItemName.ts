import type { SyncableItemName } from './metadata/SyncableItemName.ts';

export interface DynamicSyncableEncryptedItemName {
  type: 'encrypted';
  plainName: string;
}

export const encName = (plainName: string): DynamicSyncableEncryptedItemName => ({ type: 'encrypted', plainName });

export type DynamicSyncableItemName = SyncableItemName | DynamicSyncableEncryptedItemName;
