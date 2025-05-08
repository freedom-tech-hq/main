import type { Sha256Hash } from 'freedom-basic-data';
import type { NotificationManager } from 'freedom-notification-types';
import type { SyncablePath } from 'freedom-sync-types';

export interface SyncTrackerFolderAddedEvent {
  path: SyncablePath;
}

export interface SyncTrackerFolderRemovedEvent {
  path: SyncablePath;
}

export interface SyncTrackerItemAddedEvent {
  path: SyncablePath;
  hash: Sha256Hash;
}

export interface SyncTrackerItemAccessedEvent {
  path: SyncablePath;
}

export interface SyncTrackerItemNotFoundEvent {
  path: SyncablePath;
}

export type SyncTrackerNotifications = {
  folderAdded: SyncTrackerFolderAddedEvent;
  folderRemoved: SyncTrackerFolderRemovedEvent;
  /** Triggered when any item is added, including folders – which also have their own notifications */
  itemAdded: SyncTrackerItemAddedEvent;
  itemAccessed: SyncTrackerItemAccessedEvent;
  itemNotFound: SyncTrackerItemNotFoundEvent;
};

export type SyncTracker = NotificationManager<SyncTrackerNotifications>;
