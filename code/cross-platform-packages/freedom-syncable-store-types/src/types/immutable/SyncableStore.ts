import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
import type { DevLoggingSupport } from 'freedom-dev-logging-support';
import type { LockStore } from 'freedom-locking-types';
import type { Notifiable } from 'freedom-notification-types';
import type { SaltId } from 'freedom-sync-types';

import type { MutableTrustMarkStore } from '../mutable/MutableTrustMarkStore.ts';
import type { SyncableStoreLogEntry } from '../SyncableStoreLogEntry.ts';
import type { SyncTrackerNotifications } from '../SyncTracker.ts';
import type { SyncableFolderAccessor } from './SyncableFolderAccessor.ts';

export interface SyncableStore extends SyncableFolderAccessor, Notifiable<SyncTrackerNotifications> {
  readonly uid: string;

  readonly lockStore: LockStore<string>;
  readonly localTrustMarks: MutableTrustMarkStore;

  readonly creatorPublicKeys: CombinationCryptoKeySet;
  readonly userKeys: UserKeys;

  readonly saltsById: Partial<Record<SaltId, string>>;

  readonly devLogging: DevLoggingSupport<SyncableStoreLogEntry>;
}
