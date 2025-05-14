import { makeAsyncResultFunc, makeFailure, makeSuccess, type PR } from 'freedom-async';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import {
  extractSyncableItemTypeFromId,
  type PushFolderLikeItem,
  type PushItem,
  type RemoteId,
  type SyncableId,
  type SyncablePath
} from 'freedom-sync-types';
import { getMetadataAtPath } from 'freedom-syncable-store';
import { type SyncableItemAccessor, type SyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../../../types/RemoteSyncService.ts';
import { pullFileFromLocal } from '../../pull/local/pullFileFromLocal.ts';

export const organizeSyncablesForPushRequest = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: SyncableStore; syncService: RemoteSyncService },
    { remoteId, basePath, items }: { remoteId: RemoteId; basePath: SyncablePath; items: SyncableItemAccessor[] }
  ): PR<{ itemsById?: Partial<Record<string, PushItem>> }, 'not-found'> => {
    const pullFromRemoteUsingRemoteAccessor = syncService.remoteAccessors[remoteId]?.puller;
    if (pullFromRemoteUsingRemoteAccessor === undefined) {
      return makeFailure(new InternalStateError(trace, { message: `No remote accessor found for ${remoteId}` }));
    }

    const itemsById: Partial<Record<SyncableId, PushItem>> = {};

    for (const item of items) {
      const relativePathIds = item.path.relativeTo(basePath);
      if (relativePathIds === undefined) {
        continue;
      }

      let itemsCursor = itemsById;
      let pathSoFar = basePath;
      for (const id of relativePathIds) {
        pathSoFar = pathSoFar.append(id);

        const itemType = extractSyncableItemTypeFromId(id);
        switch (itemType) {
          case 'bundle':
          case 'folder':
            if (itemsCursor[id] === undefined) {
              const metadata = await getMetadataAtPath(trace, store, pathSoFar);
              if (!metadata.ok) {
                return generalizeFailureResult(trace, metadata, ['not-found', 'untrusted', 'wrong-type']);
              }

              itemsCursor[id] = { metadata: metadata.value, itemsById: {} };
            }

            itemsCursor = (itemsCursor[id] as PushFolderLikeItem).itemsById!;

            break;
          case 'file': {
            const pushFile = await pullFileFromLocal(trace, store, pathSoFar);
            if (!pushFile.ok) {
              return generalizeFailureResult(trace, pushFile, ['not-found', 'untrusted', 'wrong-type']);
            }

            itemsCursor[id] = pushFile.value;

            break;
          }
        }
      }
    }

    return makeSuccess({ itemsById });
  }
);
