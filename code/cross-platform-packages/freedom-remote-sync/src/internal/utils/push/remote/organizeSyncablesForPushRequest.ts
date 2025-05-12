import { makeAsyncResultFunc, makeFailure, makeSuccess, type PR } from 'freedom-async';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import {
  extractSyncableItemTypeFromId,
  extractSyncableItemTypeFromPath,
  type PushFolderLikeItem,
  type PushItem,
  type RemoteId,
  type SyncableId,
  type SyncablePath,
  SyncablePathPattern
} from 'freedom-sync-types';
import { findSyncables, getMetadataAtPath } from 'freedom-syncable-store';
import { ACCESS_CONTROL_BUNDLE_ID, type SyncableItemAccessor, type SyncableStore } from 'freedom-syncable-store-types';

import type { RemoteSyncService } from '../../../../types/RemoteSyncService.ts';
import { getHashesForPulledAccessControlBundleItemsByPathString } from '../../getHashesForPulledItemsByPathString.ts';
import { getLocalHashesForItemsByPathString } from '../../getLocalHashesForItemsByPathString.ts';
import { pullFileFromLocal } from '../../pull/local/pullFileFromLocal.ts';

export const organizeSyncablesForPushRequest = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { store, syncService }: { store: SyncableStore; syncService: RemoteSyncService },
    { remoteId, basePath, items }: { remoteId: RemoteId; basePath: SyncablePath; items: SyncableItemAccessor[] }
  ): PR<{ itemsById?: Partial<Record<string, PushItem>> }, 'not-found'> => {
    const pullFromRemote = syncService.remoteAccessors[remoteId]?.puller;
    if (pullFromRemote === undefined) {
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

            // For folders, we also want to check that the access control bundles are in sync and we'll inject any out-of-sync access
            // control items
            if (itemType === 'folder') {
              const accessControlBundlePath = pathSoFar.append(ACCESS_CONTROL_BUNDLE_ID);

              const localAccessControlItems = await findSyncables(trace, store, {
                basePath: accessControlBundlePath,
                glob: { include: [new SyncablePathPattern('**')] }
              });
              if (!localAccessControlItems.ok) {
                return localAccessControlItems;
              }

              const pulledAccessControlBundle = await pullFromRemote(trace, {
                basePath: accessControlBundlePath,
                sendData: false,
                localHashesRelativeToBasePath: {},
                // Getting the snapshots and all deltas bundles
                glob: { include: [new SyncablePathPattern('*')] }
              });
              if (!pulledAccessControlBundle.ok || pulledAccessControlBundle.value === 'in-sync') {
                // If there are any problems, likely the server doesn't have the parent content yet, so we'll assume we need to push
                // everything.  An in-sync response should never happen, so treating it like an error if it does
                // Appending to the items list so these will be iterated over later.  It's possible some of these are already included in
                // the items, but duplicates won't matter since the organized content won't end up containing duplicates
                items.push(...localAccessControlItems.value);
              } else {
                const localAccessControlItemHashesByPathString = await getLocalHashesForItemsByPathString(
                  trace,
                  store,
                  localAccessControlItems.value
                );
                if (!localAccessControlItemHashesByPathString.ok) {
                  return localAccessControlItemHashesByPathString;
                }

                const remoteAccessControlItemHashesByPathString = getHashesForPulledAccessControlBundleItemsByPathString(
                  trace,
                  accessControlBundlePath,
                  pulledAccessControlBundle.value
                );
                if (!remoteAccessControlItemHashesByPathString.ok) {
                  return remoteAccessControlItemHashesByPathString;
                }

                // Always including the access control bundle, snapshot bundle, and all deltas bundles
                // Only including snapshots and deltas that the server doesn't already have
                items.push(
                  ...localAccessControlItems.value.filter((item) => {
                    const pathString = item.path.toString();
                    return (
                      extractSyncableItemTypeFromPath(item.path) !== 'file' ||
                      localAccessControlItemHashesByPathString.value[pathString] !==
                        remoteAccessControlItemHashesByPathString.value[pathString]
                    );
                  })
                );
              }
            }

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
