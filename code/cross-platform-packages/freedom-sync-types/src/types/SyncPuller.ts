import type { PRFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';

import type { SyncPullResponse } from './pull-responses/SyncPullResponse.ts';
import type { RemoteId } from './RemoteId.ts';
import type { SyncablePath } from './SyncablePath.ts';

type SyncPullArgs = {
  remoteId: RemoteId;
  path: SyncablePath;
  hash?: Sha256Hash;
  /** `false` by default */
  sendData?: boolean;
};

// TODO: during pull, if we're the creator, we should try to validate and auto-approve / reject
export type SyncPuller = PRFunc<SyncPullResponse, 'not-found', [SyncPullArgs]>;
