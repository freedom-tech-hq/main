import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { PullItem, StructHashes, SyncablePath, SyncGlob } from 'freedom-sync-types';
import { extractSyncableItemTypeFromPath } from 'freedom-sync-types';
import { disableSyncableValidation, getSyncableAtPath } from 'freedom-syncable-store';
import type { SyncableFileAccessor, SyncableFolderLikeAccessor, SyncableStore } from 'freedom-syncable-store-types';

import { pullFileFromLocal } from '../internal/utils/pullFileFromLocal.ts';
import { pullFolderLikeItemFromLocal } from '../internal/utils/pullFolderLikeItemFromLocal.ts';

export const pullFromLocal = makeAsyncResultFunc(
  [import.meta.filename, 'pullFromLocal'],
  async (
    trace,
    userFs: SyncableStore,
    {
      basePath,
      localHashesRelativeToBasePath,
      glob,
      sendData
    }: {
      basePath: SyncablePath;
      localHashesRelativeToBasePath: StructHashes;
      glob?: SyncGlob;
      sendData: boolean;
    }
  ): PR<PullItem, 'not-found'> => {
    const baseItem = await disableSyncableValidation(getSyncableAtPath)(trace, userFs, basePath);
    if (!baseItem.ok) {
      return generalizeFailureResult(trace, baseItem, ['untrusted', 'wrong-type']);
    }

    const metadata = await baseItem.value.getMetadata(trace);
    if (!metadata.ok) {
      return metadata;
    }

    if (metadata.value.hash === localHashesRelativeToBasePath.hash) {
      return makeSuccess('in-sync' as const);
    }

    const baseItemType = extractSyncableItemTypeFromPath(basePath);

    switch (baseItemType) {
      case 'file':
        return await disableSyncableValidation(pullFileFromLocal)(trace, baseItem.value as SyncableFileAccessor, {
          metadata: metadata.value,
          sendData
        });

      case 'bundle':
      case 'folder':
        return await disableSyncableValidation(pullFolderLikeItemFromLocal)(trace, userFs, baseItem.value as SyncableFolderLikeAccessor, {
          metadata: metadata.value,
          localHashesRelativeToBasePath,
          glob,
          sendData
        });
    }
  },
  { deepDisableLam: 'not-found' }
);
