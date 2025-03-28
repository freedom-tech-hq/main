import type { PRFunc } from 'freedom-async';

import type { SyncableBundleMetadata } from './metadata/SyncableBundleMetadata.ts';
import type { SyncableFileMetadata } from './metadata/SyncableFileMetadata.ts';
import type { SyncableFolderMetadata } from './metadata/SyncableFolderMetadata.ts';
import type { RemoteId } from './RemoteId.ts';
import type { SyncablePath } from './SyncablePath.ts';

type SyncPushArgs = { remoteId: RemoteId; path: SyncablePath } & (
  | {
      type: 'folder';
      data?: undefined;
      metadata: SyncableFolderMetadata;
    }
  | {
      type: 'bundle';
      data?: undefined;
      metadata: SyncableBundleMetadata;
    }
  | {
      type: 'file';
      data: Uint8Array;
      metadata: SyncableFileMetadata;
    }
);

export type SyncPusher = PRFunc<undefined, never, [SyncPushArgs]>;
