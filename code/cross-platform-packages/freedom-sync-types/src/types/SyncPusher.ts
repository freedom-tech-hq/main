import type { PRFunc } from 'freedom-async';

import type { SyncableItemMetadata } from './metadata/SyncableItemMetadata.ts';
import type { RemoteId } from './RemoteId.ts';
import type { SyncablePath } from './SyncablePath.ts';

type SyncPushArgs = { remoteId: RemoteId; path: SyncablePath } & (
  | {
      type: 'folder';
      data?: undefined;
      metadata: SyncableItemMetadata;
    }
  | {
      type: 'bundle';
      data?: undefined;
      metadata: SyncableItemMetadata;
    }
  | {
      type: 'file';
      data: Uint8Array;
      metadata: SyncableItemMetadata;
    }
);

export type SyncPusher = PRFunc<undefined, never, [SyncPushArgs]>;
