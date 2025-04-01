import path from 'node:path';

import type { PR } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { FileSystemSyncableStoreBacking } from 'freedom-file-system-syncable-store-backing';
import type { StorageRootId } from 'freedom-sync-types';
import { SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore, SyncableStore } from 'freedom-syncable-store-types';
import { DefaultSyncableStore, getFolderPath, getSyncableHashAtPath } from 'freedom-syncable-store-types';

import { getAllStorageRootPath } from './getAllStorageRootPath.ts';
import { getCryptoService } from './getCryptoService.ts';
import { getSaltsStore } from './getSaltsStore.ts';

export const getSyncableStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { storageRootId }: { storageRootId: StorageRootId }): PR<{ store: MutableSyncableStore; disconnect: () => void }> => {
    const cryptoService = await uncheckedResult(getCryptoService(trace));
    const saltsStore = await uncheckedResult(getSaltsStore(trace));
    const allStorageRootPath = await uncheckedResult(getAllStorageRootPath(trace));

    const saltsById = await saltsStore.object(storageRootId).get(trace);
    if (!saltsById.ok) {
      return generalizeFailureResult(trace, saltsById, 'not-found', `Salts not found for storage root: ${storageRootId}`);
    }

    const rootPath = path.join(allStorageRootPath, storageRootId);
    const storeBacking = new FileSystemSyncableStoreBacking(rootPath);
    const rootMetadata = await storeBacking.getMetadataAtPath(trace, new SyncablePath(storageRootId));
    if (!rootMetadata.ok) {
      return generalizeFailureResult(trace, rootMetadata, ['not-found', 'wrong-type']);
    }

    const store = new DefaultSyncableStore({
      storageRootId,
      backing: storeBacking,
      provenance: rootMetadata.value.provenance,
      cryptoService,
      saltsById: saltsById.value
    });

    const onFolderAddedOrRemoved = makeAsyncResultFunc(
      [import.meta.filename, 'onFolderAddedOrRemoved'],
      async (trace, args: { store: SyncableStore; path: SyncablePath }) => {
        const parentFolderPath = await getFolderPath(trace, args.store, args.path.parentPath ?? new SyncablePath(args.path.storageRootId));
        if (!parentFolderPath.ok) {
          return parentFolderPath;
        }

        return await triggerContentChangeNotificationSoonForPath(trace, { ...args, path: parentFolderPath.value });
      }
    );

    const onNeedsSync = makeAsyncResultFunc(
      [import.meta.filename, 'onNeedsSync'],
      async (trace, args: { store: SyncableStore; path: SyncablePath }) => {
        const folderPath = await getFolderPath(trace, args.store, args.path);
        if (!folderPath.ok) {
          return folderPath;
        }

        return await triggerContentChangeNotificationSoonForPath(trace, { ...args, path: folderPath.value });
      }
    );

    const triggerContentChangeNotificationSoonForPath = makeAsyncResultFunc(
      [import.meta.filename, 'triggerContentChangeNotificationSoonForPath'],
      async (trace, { store, path }: { store: SyncableStore; path: SyncablePath }): PR<undefined> => {
        const hash = await getSyncableHashAtPath(trace, store, path);
        if (!hash.ok) {
          return generalizeFailureResult(trace, hash, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
        }

        // TODO: revisit
        // notificationQueue.add({ key: path.toString(), version: hash.value }, async (trace) => {
        //   const streamId = await generateStreamIdForPath(trace, { path });
        //   if (!streamId.ok) {
        //     return streamId;
        //   }

        //   DEV: debugTopic('SYNC', (log) => log(`REMOTE: Notifying contentChange for ${path.toString()}`));
        //   const deviceNotificationClient = deviceNotificationClientsByRemoteId[remoteId];
        //   deviceNotificationClient?.notify(`contentChange:${streamId.value}`, { hash: hash.value });

        //   return makeSuccess(undefined);
        // });

        return makeSuccess(undefined);
      }
    );

    const removeListeners: Array<() => void> = [];

    DEV: debugTopic('SYNC', (log) => log(`REMOTE: Added folderAdded listener for ${store.path.toString()}`));
    removeListeners.push(
      store.addListener('folderAdded', ({ path }) => {
        DEV: debugTopic('SYNC', (log) => log(`REMOTE: Received folderAdded for ${path.toString()}`));
        onFolderAddedOrRemoved(trace, { store: store, path });
      })
    );

    DEV: debugTopic('SYNC', (log) => log(`REMOTE: Added folderRemoved listener for ${store.path.toString()}`));
    removeListeners.push(
      store.addListener('folderRemoved', ({ path }) => {
        DEV: debugTopic('SYNC', (log) => log(`REMOTE: Received folderRemoved for ${path.toString()}`));
        onFolderAddedOrRemoved(trace, { store: store, path });
      })
    );

    DEV: debugTopic('SYNC', (log) => log(`REMOTE: Added needsSync listener for ${store.path.toString()}`));
    removeListeners.push(
      store.addListener('needsSync', ({ path, hash }) => {
        DEV: debugTopic('SYNC', (log) => log(`REMOTE: Received needsSync for ${path.toString()}: ${hash}`));
        onNeedsSync(trace, { store: store, path });
      })
    );

    return makeSuccess({
      store: store,
      disconnect: () => {
        const removeListenersCopy = [...removeListeners];
        removeListeners.length = 0;

        for (const removeListener of removeListenersCopy) {
          removeListener();
        }
      }
    });
  }
);
