import type { RemoteId } from './RemoteId.ts';
import type { SyncPuller } from './SyncPuller.ts';
import type { SyncPusher } from './SyncPusher.ts';

export interface RemoteAccessor {
  readonly remoteId: RemoteId;

  readonly puller: SyncPuller;
  readonly pusher: SyncPusher;
}
