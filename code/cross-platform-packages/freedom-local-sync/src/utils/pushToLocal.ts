import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { PullItem, PushItem, SyncablePath } from 'freedom-sync-types';
import { disableSyncableValidation } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { pushItemToLocal } from '../internal/utils/pushItemToLocal.ts';
import { pullFromLocal } from './pullFromLocal.ts';

export const pushToLocal = makeAsyncResultFunc(
  [import.meta.filename, 'pushToLocal'],
  async (
    trace,
    userFs: MutableSyncableStore,
    {
      basePath,
      item
    }: {
      basePath: SyncablePath;
      item: PushItem;
    }
  ): PR<PullItem, 'not-found'> => {
    const pushed = await disableSyncableValidation(pushItemToLocal)(trace, userFs, { basePath, item });
    if (!pushed.ok) {
      return pushed;
    }

    return await pullFromLocal(trace, userFs, { basePath, localHashesRelativeToBasePath: {}, sendData: false });
  }
);
