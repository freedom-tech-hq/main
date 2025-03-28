import type { Uuid } from 'freedom-basic-data';

import type { SyncableItemName } from './metadata/SyncableItemName.ts';

export interface DynamicSyncableEncryptedItemName {
  type: 'encrypted';
  plainName: string;
}

export const encName = (plainName: string): DynamicSyncableEncryptedItemName => ({ type: 'encrypted', plainName });

export interface DynamicSyncableTimeItemName {
  type: 'time';
  uuid: Uuid;
}

export const timeName = (uuid: Uuid): DynamicSyncableTimeItemName => ({ type: 'time', uuid });

export type DynamicSyncableItemName = SyncableItemName | DynamicSyncableEncryptedItemName | DynamicSyncableTimeItemName;
