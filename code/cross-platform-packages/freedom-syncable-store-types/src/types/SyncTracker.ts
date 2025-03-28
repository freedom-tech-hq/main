import type { Sha256Hash } from 'freedom-basic-data';
import type { NotificationManager } from 'freedom-notification-types';
import type { SyncableItemType, SyncablePath } from 'freedom-sync-types';

export type SyncTrackerNotifications = {
  folderAdded: { path: SyncablePath };
  folderRemoved: { path: SyncablePath };
  needsSync: { type: SyncableItemType; path: SyncablePath; hash: Sha256Hash };
};

export type SyncTracker = NotificationManager<SyncTrackerNotifications>;
