import type { PR } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { base64String } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractKeyIdFromSignature, generateSha256HashFromString } from 'freedom-crypto';
import { FileSystemSyncableStoreBacking } from 'freedom-file-system-syncable-store-backing';
import type { StorageRootId } from 'freedom-sync-types';
import { SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableStore, SyncableStore } from 'freedom-syncable-store-types';
import { DefaultSyncableStore, getFolderPath, getSyncableHashAtPath } from 'freedom-syncable-store-types';

import { getCryptoService } from './getCryptoService.ts';
import { getFsRootPathForStorageRootId } from './getFsRootPathForStorageRootId.ts';
import { getPublicKeyStore } from './getPublicKeyStore.ts';
import { getSaltsStore } from './getSaltsStore.ts';

export const getSyncableStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { storageRootId }: { storageRootId: StorageRootId }): PR<{ store: MutableSyncableStore; disconnect: () => void }> => {
    const cryptoService = await uncheckedResult(getCryptoService(trace));
    const publicKeyStore = await uncheckedResult(getPublicKeyStore(trace));
    const saltsStore = await uncheckedResult(getSaltsStore(trace));
    const rootPath = await uncheckedResult(getFsRootPathForStorageRootId(trace, storageRootId));

    const saltsById = await saltsStore.object(storageRootId).get(trace);
    if (!saltsById.ok) {
      return generalizeFailureResult(trace, saltsById, 'not-found', `Salts not found for storage root: ${storageRootId}`);
    }

    const hashedStorageRootId = await generateSha256HashFromString(trace, storageRootId);
    if (!hashedStorageRootId.ok) {
      return hashedStorageRootId;
    }

    const storeBacking = new FileSystemSyncableStoreBacking(rootPath);
    const rootMetadata = await storeBacking.getMetadataAtPath(trace, new SyncablePath(storageRootId));
    if (!rootMetadata.ok) {
      return generalizeFailureResult(trace, rootMetadata, ['not-found', 'wrong-type']);
    }

    const creatorPublicKeysId = extractKeyIdFromSignature(trace, {
      signature: base64String.toBuffer(rootMetadata.value.provenance.origin.signature)
    });
    if (!creatorPublicKeysId.ok) {
      return generalizeFailureResult(trace, creatorPublicKeysId, 'not-found');
    }

    const creatorPublicKeys = await publicKeyStore.object(creatorPublicKeysId.value).get(trace);
    if (!creatorPublicKeys.ok) {
      return generalizeFailureResult(trace, creatorPublicKeys, 'not-found');
    }

    const store = new DefaultSyncableStore({
      storageRootId,
      backing: storeBacking,
      creatorPublicKeys: creatorPublicKeys.value,
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

    const onItemAdded = makeAsyncResultFunc(
      [import.meta.filename, 'onItemAdded'],
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

    DEV: debugTopic('SYNC', (log) => log(`REMOTE: Added itemAdded listener for ${store.path.toString()}`));
    removeListeners.push(
      store.addListener('itemAdded', ({ path, hash }) => {
        DEV: debugTopic('SYNC', (log) => log(`REMOTE: Received itemAdded for ${path.toString()}: ${hash}`));
        onItemAdded(trace, { store: store, path });
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
