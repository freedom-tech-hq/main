import type { Uuid } from 'freedom-basic-data';

import type { SyncableId } from './SyncableId.ts';

export interface DynamicSyncableEncryptedId {
  type: 'encrypted';
  plainId: string;
}

export const encId = (plainId: string): DynamicSyncableEncryptedId => ({ type: 'encrypted', plainId });

export interface DynamicSyncableTimeName {
  type: 'time';
  uuid: Uuid;
}

export const timeName = (uuid: Uuid): DynamicSyncableTimeName => ({ type: 'time', uuid });

export type DynamicSyncableId = SyncableId | DynamicSyncableEncryptedId | DynamicSyncableTimeName;
