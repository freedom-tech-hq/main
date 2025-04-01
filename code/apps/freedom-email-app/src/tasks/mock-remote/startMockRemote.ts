import type { PR, PRFunc, Result } from 'freedom-async';
import { debugTopic, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ConflictError, generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { makeSubTrace, makeTrace, makeUuid } from 'freedom-contexts';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import type { DeviceNotificationClient, DeviceNotifications } from 'freedom-device-notification-types';
import { NotificationManager } from 'freedom-notification-types';
import type { RemoteAccessor, StorageRootId, SyncableItemMetadata, SyncPuller, SyncPullResponse, SyncPusher } from 'freedom-sync-types';
import { DEFAULT_SALT_ID, SyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';
import {
  DefaultSyncableStore,
  getFolderPath,
  getSyncableHashAtPath,
  InMemorySyncableStoreBacking,
  pullPath,
  pushPath
} from 'freedom-syncable-store-types';
import { TaskQueue } from 'freedom-task-queue';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { makeCryptoServiceWithPublicKeys } from './makeCryptoServiceWithPublicKeys.ts';

export interface MockRemote {
  readonly remoteAccessor: RemoteAccessor;
  readonly deviceNotificationClient: DeviceNotificationClient;
  readonly getMockRemoteStore: PRFunc<DefaultSyncableStore, 'not-found', [storageRootId: StorageRootId]>;
  readonly createMockRemoteStore: PRFunc<DefaultSyncableStore, 'conflict', [storageRootId: StorageRootId, metadata: SyncableItemMetadata]>;
  readonly stop: () => void;
}

export interface WithMockRemoteArgs {
  creatorPublicCryptoKeysSet: CombinationCryptoKeySet;
}

export const startMockRemote = async (_trace: Trace, { creatorPublicCryptoKeysSet }: WithMockRemoteArgs): PR<MockRemote> => {
  const userStores: Partial<Record<StorageRootId, DefaultSyncableStore>> = {};

  const removeListeners: Array<() => void> = [];

  const notificationQueue = new TaskQueue(makeTrace('setupMockRemotes'));
  notificationQueue.start();

  const deviceNotificationClient = new NotificationManager<DeviceNotifications>();

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

      notificationQueue.add({ key: path.toString(), version: hash.value }, async (_trace) => {
        // TODO: TEMP
        const streamId = path.toString();

        DEV: debugTopic('SYNC', (log) => log(`REMOTE: Notifying contentChange for ${path.toString()}`));
        deviceNotificationClient.notify(`contentChange:${streamId}`, { hash: hash.value });

        return makeSuccess(undefined);
      });

      return makeSuccess(undefined);
    }
  );

  const getMockRemoteStore = makeAsyncResultFunc(
    [import.meta.filename, 'getMockRemoteStore'],
    async (trace: Trace, storageRootId: StorageRootId): PR<DefaultSyncableStore, 'not-found'> => {
      const store = userStores[storageRootId];
      if (store === undefined) {
        return makeFailure(new NotFoundError(trace, { errorCode: 'not-found' }));
      }

      return makeSuccess(store);
    }
  );

  const createMockRemoteStore = makeAsyncResultFunc(
    [import.meta.filename, 'createMockRemoteStore'],
    async (trace: Trace, storageRootId: StorageRootId, metadata: SyncableItemMetadata): PR<DefaultSyncableStore, 'conflict'> => {
      let store = userStores[storageRootId];
      if (store !== undefined) {
        return makeFailure(new ConflictError(trace, { errorCode: 'conflict' }));
      }

      const cryptoService = makeCryptoServiceWithPublicKeys({ publicKeys: creatorPublicCryptoKeysSet });

      const storeBacking = new InMemorySyncableStoreBacking(metadata);

      const newStore = new DefaultSyncableStore({
        storageRootId,
        backing: storeBacking,
        provenance: metadata.provenance,
        cryptoService,
        saltsById: { [DEFAULT_SALT_ID]: makeUuid() }
      });
      store = newStore;

      userStores[storageRootId] = newStore;

      DEV: debugTopic('SYNC', (log) => log(`REMOTE: Added folderAdded listener for ${newStore.path.toString()}`));
      DEV: removeListeners.push(
        newStore.addListener('folderAdded', ({ path }) => {
          DEV: debugTopic('SYNC', (log) => log(`REMOTE: Received folderAdded for ${path.toString()}`));
          onFolderAddedOrRemoved(trace, { store: newStore, path });
        })
      );

      DEV: debugTopic('SYNC', (log) => log(`REMOTE: Added folderRemoved listener for ${newStore.path.toString()}`));
      DEV: removeListeners.push(
        newStore.addListener('folderRemoved', ({ path }) => {
          DEV: debugTopic('SYNC', (log) => log(`REMOTE: Received folderRemoved for ${path.toString()}`));
          onFolderAddedOrRemoved(trace, { store: newStore, path });
        })
      );

      DEV: debugTopic('SYNC', (log) => log(`REMOTE: Added needsSync listener for ${newStore.path.toString()}`));
      DEV: removeListeners.push(
        newStore.addListener('needsSync', ({ path, hash }) => {
          DEV: debugTopic('SYNC', (log) => log(`REMOTE: Received needsSync for ${path.toString()}: ${hash}`));
          onNeedsSync(trace, { store: newStore, path });
        })
      );

      return makeSuccess(store);
    }
  );

  const puller: SyncPuller = makeAsyncResultFunc(
    [import.meta.filename, 'puller'],
    async (localTrace, args): PR<SyncPullResponse, 'not-found'> => {
      const trace = makeSubTrace(localTrace, ['REMOTE']);

      const store = await disableLam(trace, 'not-found', (trace) => getMockRemoteStore(trace, args.path.storageRootId));
      if (!store.ok) {
        return store;
      }

      return await pullPath(trace, store.value, args);
    }
  );

  const pusher: SyncPusher = makeAsyncResultFunc([import.meta.filename, 'pusher'], async (localTrace, args): PR<undefined> => {
    const trace = makeSubTrace(localTrace, ['REMOTE']);

    let store: Result<DefaultSyncableStore, 'conflict' | 'not-found'> = await disableLam(trace, 'not-found', (trace) =>
      getMockRemoteStore(trace, args.path.storageRootId)
    );
    if (!store.ok) {
      // Creating the storage on the first push of root if it doesn't exist
      if (store.value.errorCode === 'not-found' && args.path.ids.length === 0) {
        store = await createMockRemoteStore(trace, args.path.storageRootId, args.metadata);
        if (!store.ok) {
          return generalizeFailureResult(trace, store, ['conflict', 'not-found']);
        }
      } else {
        return generalizeFailureResult(trace, store, ['conflict', 'not-found']);
      }
    }

    return await pushPath(trace, store.value, args);
  });

  return makeSuccess({
    remoteAccessor: { puller, pusher },
    deviceNotificationClient,
    getMockRemoteStore,
    createMockRemoteStore,
    stop: () => {
      notificationQueue.stop();

      const removeListenersCopy = [...removeListeners];
      removeListeners.length = 0;

      for (const removeListener of removeListenersCopy) {
        removeListener();
      }
    }
  });
};
