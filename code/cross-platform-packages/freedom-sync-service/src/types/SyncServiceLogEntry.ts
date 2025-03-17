import type { RemoteId, SyncableItemType } from 'freedom-sync-types';

export interface SyncServiceLogEntryPull {
  type: 'pull';
  itemType: SyncableItemType;
  remoteId: RemoteId;
  pathString: string;
  outOfSync: boolean;
}

export interface SyncServiceLogEntryPush {
  type: 'push';
  itemType: SyncableItemType;
  remoteId: RemoteId;
  pathString: string;
}

export interface SyncServiceLogEntryNotified {
  type: 'notified';
  pathString: string;
}

export type SyncServiceLogEntry = SyncServiceLogEntryPull | SyncServiceLogEntryPush | SyncServiceLogEntryNotified;
