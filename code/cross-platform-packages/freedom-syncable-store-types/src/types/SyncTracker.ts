import type { Sha256Hash } from 'freedom-basic-data';
import type { NotificationManager } from 'freedom-notification-types';
import type { StaticSyncablePath, SyncableItemType } from 'freedom-sync-types';

export type SyncTrackerNotifications = {
  folderAdded: { path: StaticSyncablePath };
  folderRemoved: { path: StaticSyncablePath };
  needsSync: { type: SyncableItemType; path: StaticSyncablePath; hash: Sha256Hash };
};

export type SyncTracker = NotificationManager<SyncTrackerNotifications>;
