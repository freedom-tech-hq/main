import type { PR } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import {
  type LocalItemMetadata,
  type PullItem,
  type StructHashes,
  type SyncableItemMetadata,
  SyncablePathPattern,
  type SyncGlob
} from 'freedom-sync-types';
import { disableSyncableValidation, findSyncables } from 'freedom-syncable-store';
import type { SyncableFolderLikeAccessor, SyncableStore } from 'freedom-syncable-store-types';

import { organizeSyncablesForPullResponse } from './organizeSyncablesForPullResponse.ts';

export const pullFolderLikeItemFromLocal = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    userFs: SyncableStore,
    item: SyncableFolderLikeAccessor,
    {
      metadata,
      localHashesRelativeToBasePath,
      glob,
      sendData
    }: {
      metadata: SyncableItemMetadata & LocalItemMetadata;
      localHashesRelativeToBasePath: StructHashes;
      glob?: SyncGlob;
      sendData: boolean;
    }
  ): PR<PullItem, 'not-found'> => {
    DEV: debugTopic('SYNC', (log) => log(trace, `Pulling ${item.path.toShortString()} from local`));

    const found = await disableSyncableValidation(findSyncables)(trace, userFs, {
      basePath: item.path,
      glob: glob ?? { include: [new SyncablePathPattern()] }
    });
    if (!found.ok) {
      return found;
    }

    const organized = await organizeSyncablesForPullResponse(trace, userFs, {
      basePath: item.path,
      items: found.value,
      localHashesRelativeToBasePath,
      sendData
    });
    if (!organized.ok) {
      return organized;
    }

    return makeSuccess({ metadata, itemsById: organized.value.itemsById });
  }
);
