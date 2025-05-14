import type { RemoteId, SyncablePath } from 'freedom-sync-types';

export interface RemoteSyncLogEntryPull {
  type: 'pull';
  remoteId: RemoteId;
  path: SyncablePath;
  outOfSync: boolean;
  numHashes: number;
  numFolders: number;
  numBundles: number;
  numFiles: number;
  numFileDatas: number;
}

export interface RemoteSyncLogEntryPush {
  type: 'push';
  remoteId: RemoteId;
  path: SyncablePath;
  numFolders: number;
  numBundles: number;
  numFiles: number;
}

export interface RemoteSyncLogEntryNotified {
  type: 'notified';
  path: SyncablePath;
}

export type RemoteSyncLogEntry = RemoteSyncLogEntryPull | RemoteSyncLogEntryPush | RemoteSyncLogEntryNotified;
