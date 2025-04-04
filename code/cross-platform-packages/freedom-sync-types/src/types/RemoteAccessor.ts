import type { SyncPuller } from './SyncPuller.ts';
import type { SyncPusher } from './SyncPusher.ts';

export interface RemoteAccessor {
  readonly puller: SyncPuller;
  readonly pusher: SyncPusher;
}
