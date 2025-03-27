import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { DynamicSyncableId, SyncableItemType } from 'freedom-sync-types';
import type { SingleOrArray } from 'yaschema';

import type { SyncableBundleAccessor } from '../../types/SyncableBundleAccessor.ts';
import type { SyncableFolderAccessor } from '../../types/SyncableFolderAccessor.ts';

export const getDynamicIds = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    inFolderLike: SyncableFolderAccessor | SyncableBundleAccessor,
    options?: { type?: SingleOrArray<SyncableItemType> }
  ): PR<DynamicSyncableId[]> => {
    const fileIds = await inFolderLike.getIds(trace, options);
    if (!fileIds.ok) {
      return fileIds;
    }

    const dynamicFileIds = await allResultsMapped(
      trace,
      fileIds.value,
      {},
      async (trace, id): PR<DynamicSyncableId> => await inFolderLike.staticToDynamicId(trace, id)
    );
    if (!dynamicFileIds.ok) {
      return dynamicFileIds;
    }

    return makeSuccess(dynamicFileIds.value);
  }
);
