import type { PRFunc } from 'freedom-async';
import type { Notifiable } from 'freedom-notification-types';

import type { BundleManagement } from './BundleManagement.ts';
import type { FolderManagement } from './FolderManagement.ts';
import type { MutableAccessControlledFolderAccessor } from './MutableAccessControlledFolderAccessor.ts';
import type { SyncableStore } from './SyncableStore.ts';
import type { SyncTrackerNotifications } from './SyncTracker.ts';

export interface MutableSyncableStore
  extends SyncableStore,
    MutableAccessControlledFolderAccessor,
    FolderManagement,
    BundleManagement,
    Notifiable<SyncTrackerNotifications> {
  /** Initializes the folder for use and sets initial access settings.  This must be done exactly once for locally-created folders. */
  readonly initialize: PRFunc<undefined, 'conflict'>;
}
