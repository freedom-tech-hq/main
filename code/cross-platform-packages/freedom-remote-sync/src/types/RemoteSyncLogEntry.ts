import type { RemoteId, SyncablePath } from 'freedom-sync-types';

export interface RemoteSyncLogEntryPull {
  type: 'pull';
  remoteId: RemoteId;
  path: SyncablePath;
  outOfSync: boolean;
}

export interface RemoteSyncLogEntryPush {
  type: 'push';
  remoteId: RemoteId;
  path: SyncablePath;
}

export interface RemoteSyncLogEntryNotified {
  type: 'notified';
  path: SyncablePath;
}

export type RemoteSyncLogEntry = RemoteSyncLogEntryPull | RemoteSyncLogEntryPush | RemoteSyncLogEntryNotified;
