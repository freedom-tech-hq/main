import type { PRFunc } from 'freedom-async';

import type { RemoteId } from './RemoteId.ts';
import type { StaticSyncablePath } from './StaticSyncablePath.ts';
import type { SyncableProvenance } from './SyncableProvenance.ts';

type SyncPushArgs = { remoteId: RemoteId; path: StaticSyncablePath; provenance: SyncableProvenance } & (
  | {
      type: 'folder' | 'bundleFile';
      data?: undefined;
    }
  | {
      type: 'flatFile';
      data: Uint8Array;
    }
);

export type SyncPusher = PRFunc<undefined, never, [SyncPushArgs]>;
