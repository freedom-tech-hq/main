import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { PushFile, PushFolderLikeItem, PushItem, SyncablePath } from 'freedom-sync-types';
import { extractSyncableItemTypeFromPath } from 'freedom-sync-types';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { pushFileToLocal } from '../internal/utils/pushFileToLocal.ts';
import { pushFolderLikeItemToLocal } from '../internal/utils/pushFolderLikeItemToLocal.ts';

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
  ): PR<undefined, 'not-found'> => {
    const itemType = extractSyncableItemTypeFromPath(basePath);
    switch (itemType) {
      case 'file':
        return await pushFileToLocal(trace, userFs, item as PushFile, { path: basePath });

      case 'bundle':
      case 'folder':
        return await pushFolderLikeItemToLocal(trace, userFs, item as PushFolderLikeItem, { path: basePath });
    }
  }
);
