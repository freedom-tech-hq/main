import type { PRFunc } from 'freedom-async';

import type { RemoteId } from './RemoteId.ts';
import type { StaticSyncablePath } from './StaticSyncablePath.ts';
import type { SyncableProvenance } from './SyncableProvenance.ts';

type SyncPushArgs = { remoteId: RemoteId; path: StaticSyncablePath; provenance: SyncableProvenance } & (
  | {
      type: 'folder' | 'bundle';
      data?: undefined;
    }
  | {
      type: 'file';
      data: Uint8Array;
    }
);

export type SyncPusher = PRFunc<undefined, never, [SyncPushArgs]>;
