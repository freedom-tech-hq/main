import type { Uuid } from 'freedom-basic-data';

import type { SyncableId } from './SyncableId.ts';

export interface DynamicSyncableEncryptedId {
  type: 'encrypted';
  plainId: string;
}

export const encId = (plainId: string): DynamicSyncableEncryptedId => ({ type: 'encrypted', plainId });

export interface DynamicSyncableTimeId {
  type: 'time';
  uuid: Uuid;
}

export const timeId = (uuid: Uuid): DynamicSyncableTimeId => ({ type: 'time', uuid });

export type DynamicSyncableId = SyncableId | DynamicSyncableEncryptedId | DynamicSyncableTimeId;
