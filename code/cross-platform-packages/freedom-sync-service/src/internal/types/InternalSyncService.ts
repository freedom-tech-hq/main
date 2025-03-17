import type { SyncPuller, SyncPusher } from 'freedom-sync-types';

import type { SyncService } from '../../types/SyncService.ts';
import type { SyncServiceLogEntry } from '../../types/SyncServiceLogEntry.ts';

export interface InternalSyncService extends SyncService {
  appendLogEntry: ((entry: SyncServiceLogEntry) => void) | undefined;
  puller: SyncPuller;
  pusher: SyncPusher;
}
