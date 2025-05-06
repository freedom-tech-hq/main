import type { PRFunc } from 'freedom-async';

import type { RemoteAccessor } from './RemoteAccessor.ts';
import type { RemoteChangeNotificationClient } from './RemoteChangeNotificationClient.ts';

export interface RemoteConnection {
  readonly accessor: RemoteAccessor;
  readonly changeNotificationClient: RemoteChangeNotificationClient;
}

export interface ControllableRemoteConnection extends RemoteConnection {
  readonly start: PRFunc<{ stop: PRFunc<undefined> }>;
}
