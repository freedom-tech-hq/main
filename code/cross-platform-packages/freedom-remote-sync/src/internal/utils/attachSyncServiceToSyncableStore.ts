import type { PR } from 'freedom-async';
import { allResultsMapped, debugTopic, excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { objectValues } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { RemoteChangeNotificationClient, RemoteId, SyncablePath } from 'freedom-sync-types';
import { getMetadataAtPath, getRecursiveFolderPaths } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import type { RemoteSyncService } from '../../types/RemoteSyncService.ts';

/** @returns a function to detach */
export const attachSyncServiceToSyncableStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    syncService: RemoteSyncService,
    {
      store,
      remoteChangeNotificationClients
    }: {
      store: MutableSyncableStore;
      remoteChangeNotificationClients: RemoteChangeNotificationClient[];
    }
  ): PR<{ detach: () => void }> => {
    // TODO: probably separate this from the other syncing stuff
    let removeListenersByFolderPath: Partial<Record<string, (() => void)[]>> = {};

    const removeListeners = (removeListenersByFolderPath: Partial<Record<string, (() => void)[]>>) => {
      for (const removeListeners of objectValues(removeListenersByFolderPath)) {
        for (const removeListener of removeListeners ?? []) {
          removeListener();
        }
      }
    };

    const onRemoteContentChange = makeAsyncResultFunc(
      [import.meta.filename, 'onRemoteContentChange'],
      async (trace, { remoteId, path, hash: remoteHash }: { remoteId: RemoteId; path: SyncablePath; hash: Sha256Hash }): PR<undefined> => {
        DEV: syncService.devLogging.appendLogEntry?.({ type: 'notified', path });

        const localMetadata = await disableLam('not-found', getMetadataAtPath)(trace, store, path);
        if (!localMetadata.ok) {
          // 'not-found' errors are expected in cases where the remote has content that the local doesn't know about yet
          if (localMetadata.value.errorCode !== 'not-found') {
            return generalizeFailureResult(trace, excludeFailureResult(localMetadata, 'not-found'), ['untrusted', 'wrong-type']);
          }
        } else if (localMetadata.value.hash === remoteHash) {
          return makeSuccess(undefined);
        }

        return syncService.enqueuePullFromRemotes(trace, {
          remoteId,
          basePath: path,
          hash: localMetadata.ok ? localMetadata.value.hash : undefined
        });
      }
    );

    const onFolderAdded = makeAsyncResultFunc([import.meta.filename, 'onFolderAdded'], async (trace, path: SyncablePath): PR<undefined> => {
      const pathString = path.toString();
      // TODO: there's a race condition here if the folder is removed during the generateStreamIdForPath call

      DEV: debugTopic('SYNC', (log) => log(trace, `Adding contentChange listeners for ${path.toShortString()}`));
      for (const remoteChangeNotificationClient of remoteChangeNotificationClients) {
        removeListenersByFolderPath[pathString] = removeListenersByFolderPath[pathString] ?? [];
        removeListenersByFolderPath[pathString].push(
          remoteChangeNotificationClient.addListener(`contentChange:${pathString}`, ({ remoteId, hash }) => {
            onRemoteContentChange(trace, { remoteId, path, hash });
          })
        );
      }

      // Pulling whenever we add a new folder because otherwise there's a race condition where the folder could have been changed on the
      // remote in the meantime
      return syncService.enqueuePullFromRemotes(trace, { basePath: path });
    });

    const onFolderRemoved = (folderPath: SyncablePath) => {
      const folderPathString = folderPath.toString();
      const removeListeners = removeListenersByFolderPath[folderPathString];
      delete removeListenersByFolderPath[folderPathString];
      for (const removeListener of removeListeners ?? []) {
        removeListener();
      }

      return makeSuccess(undefined);
    };

    const onItemAdded = ({ path, hash }: { path: SyncablePath; hash: Sha256Hash }) =>
      syncService.enqueuePushToRemotes(trace, { basePath: path, hash });

    const rootAdded = await onFolderAdded(trace, store.path);
    if (!rootAdded.ok) {
      return rootAdded;
    }

    const allFolderPaths = await getRecursiveFolderPaths(trace, store);
    if (!allFolderPaths.ok) {
      return allFolderPaths;
    }

    const foldersAdded = await allResultsMapped(trace, allFolderPaths.value, {}, async (trace, folderPath) => {
      const folderAdded = await onFolderAdded(trace, folderPath);
      if (!folderAdded.ok) {
        return folderAdded;
      }

      return makeSuccess(undefined);
    });
    if (!foldersAdded.ok) {
      return foldersAdded;
    }

    DEV: debugTopic('SYNC', (log) => log(trace, `Added folderAdded listener for ${store.path.toShortString()}`));
    const removeLocalFolderAddedListener = store.addListener('folderAdded', ({ path }) => {
      DEV: debugTopic('SYNC', (log) => log(trace, `Received folderAdded for ${path.toShortString()}`));
      onFolderAdded(trace, path);
    });

    DEV: debugTopic('SYNC', (log) => log(trace, `Added folderRemoved listener for ${store.path.toShortString()}`));
    const removeLocalFolderRemovedListener = store.addListener('folderRemoved', ({ path }) => {
      DEV: debugTopic('SYNC', (log) => log(trace, `Received folderRemoved for ${path.toShortString()}`));
      onFolderRemoved(path);
    });

    DEV: debugTopic('SYNC', (log) => log(trace, `Added itemAdded listener for ${store.path.toShortString()}`));
    const removeLocalItemAddedListener = store.addListener('itemAdded', async ({ path, hash }) => {
      DEV: debugTopic('SYNC', (log) => log(trace, `Received itemAdded for ${path.toShortString()}: ${hash}`));
      onItemAdded({ path, hash });
    });

    return makeSuccess({
      detach: () => {
        removeListeners(removeListenersByFolderPath);
        removeListenersByFolderPath = {};
        removeLocalFolderAddedListener();
        removeLocalFolderRemovedListener();
        removeLocalItemAddedListener();
      }
    });
  }
);
