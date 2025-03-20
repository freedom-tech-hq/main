/* eslint-disable react-hooks/rules-of-hooks */
import type { PR, PRFunc, Result } from 'freedom-async';
import { debugTopic, excludeFailureResult, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { ConflictError, generalizeFailureResult, NotFoundError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { makeSubTrace, makeTrace } from 'freedom-contexts';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import type { DeviceNotificationClient, DeviceNotifications } from 'freedom-device-notification-types';
import { NotificationManager } from 'freedom-notification-types';
import { generateStreamIdForPath } from 'freedom-sync-service';
import type {
  InSyncBundle,
  InSyncFile,
  InSyncFolder,
  OutOfSyncBundle,
  OutOfSyncFile,
  OutOfSyncFolder,
  RemoteId,
  StorageRootId,
  SyncableProvenance,
  SyncPuller,
  SyncPullResponse,
  SyncPusher
} from 'freedom-sync-types';
import { StaticSyncablePath } from 'freedom-sync-types';
import type { SyncableStore } from 'freedom-syncable-store-types';
import {
  createViaSyncBundleAtPath,
  createViaSyncFolderAtPath,
  createViaSyncPreEncodedBinaryFileAtPath,
  DefaultSyncableStore,
  getFolderPath,
  getSyncableAtPath,
  getSyncableHashAtPath,
  InMemorySyncableStoreBacking
} from 'freedom-syncable-store-types';
import { TaskQueue } from 'freedom-task-queue';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { useUserSyncableRemotes } from '../contexts/user-syncable-remotes.ts';
import { makeCryptoServiceWithPublicKeys } from './makeCryptoServiceWithPublicKeys.ts';

export interface MockRemotes {
  readonly puller: SyncPuller;
  readonly pusher: SyncPusher;
  readonly getMockRemoteStore: PRFunc<DefaultSyncableStore, 'not-found', [remoteId: RemoteId, storageRootId: StorageRootId]>;
  readonly createMockRemoteStore: PRFunc<
    DefaultSyncableStore,
    'conflict',
    [remoteId: RemoteId, storageRootId: StorageRootId, provenance: SyncableProvenance]
  >;
  readonly deviceNotificationClients: () => DeviceNotificationClient[];
  readonly stop: () => void;
}

export interface WithMockRemotesArgs {
  creatorPublicCryptoKeysSet: CombinationCryptoKeySet;
}

export const startMockRemotes = async (trace: Trace, { creatorPublicCryptoKeysSet }: WithMockRemotesArgs): PR<MockRemotes> => {
  const userSyncableRemotes = useUserSyncableRemotes(trace);

  const userStores: Partial<Record<`${RemoteId}.${StorageRootId}`, DefaultSyncableStore>> = {};

  const removeListeners: Array<() => void> = [];

  const notificationQueue = new TaskQueue(makeTrace('setupMockRemotes'));
  notificationQueue.start();

  // TODO: this isn't great since its using userSyncableRemotes().  really should stop using global configs
  const deviceNotificationClientsByRemoteId = userSyncableRemotes.reduce(
    (out, remoteInfo) => {
      out[remoteInfo.id] = new NotificationManager<DeviceNotifications>();
      return out;
    },
    {} as Record<RemoteId, NotificationManager<DeviceNotifications>>
  );
  const deviceNotificationClients = () => Object.values(deviceNotificationClientsByRemoteId);

  const onFolderAddedOrRemoved = makeAsyncResultFunc(
    [import.meta.filename, 'onFolderAddedOrRemoved'],
    async (trace, args: { store: SyncableStore; remoteId: RemoteId; path: StaticSyncablePath }) => {
      const parentFolderPath = await getFolderPath(
        trace,
        args.store,
        args.path.parentPath ?? new StaticSyncablePath(args.path.storageRootId)
      );
      if (!parentFolderPath.ok) {
        return parentFolderPath;
      }

      return await triggerContentChangeNotificationSoonForPath(trace, { ...args, path: parentFolderPath.value });
    }
  );

  const onNeedsSync = makeAsyncResultFunc(
    [import.meta.filename, 'onNeedsSync'],
    async (trace, args: { store: SyncableStore; remoteId: RemoteId; path: StaticSyncablePath }) => {
      const folderPath = await getFolderPath(trace, args.store, args.path);
      if (!folderPath.ok) {
        return folderPath;
      }

      return await triggerContentChangeNotificationSoonForPath(trace, { ...args, path: folderPath.value });
    }
  );

  const triggerContentChangeNotificationSoonForPath = makeAsyncResultFunc(
    [import.meta.filename, 'triggerContentChangeNotificationSoonForPath'],
    async (trace, { store, remoteId, path }: { store: SyncableStore; remoteId: RemoteId; path: StaticSyncablePath }): PR<undefined> => {
      const hash = await getSyncableHashAtPath(trace, store, path);
      if (!hash.ok) {
        return generalizeFailureResult(trace, hash, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
      }

      notificationQueue.add({ key: `${remoteId}.${path.toString()}`, version: hash.value }, async (trace) => {
        const streamId = await generateStreamIdForPath(trace, { path });
        if (!streamId.ok) {
          return streamId;
        }

        DEV: debugTopic('SYNC', (log) => log(`REMOTE: Notifying contentChange for ${path.toString()}`));
        const deviceNotificationClient = deviceNotificationClientsByRemoteId[remoteId];
        deviceNotificationClient?.notify(`contentChange:${streamId.value}`, { hash: hash.value });

        return makeSuccess(undefined);
      });

      return makeSuccess(undefined);
    }
  );

  const getMockRemoteStore = makeAsyncResultFunc(
    [import.meta.filename, 'getMockRemoteStore'],
    async (trace: Trace, remoteId: RemoteId, storageRootId: StorageRootId): PR<DefaultSyncableStore, 'not-found'> => {
      const key: `${RemoteId}.${StorageRootId}` = `${remoteId}.${storageRootId}`;

      const store = userStores[key];
      if (store === undefined) {
        return makeFailure(new NotFoundError(trace, { errorCode: 'not-found' }));
      }

      return makeSuccess(store);
    }
  );

  const createMockRemoteStore = makeAsyncResultFunc(
    [import.meta.filename, 'createMockRemoteStore'],
    async (
      trace: Trace,
      remoteId: RemoteId,
      storageRootId: StorageRootId,
      provenance: SyncableProvenance
    ): PR<DefaultSyncableStore, 'conflict'> => {
      const key: `${RemoteId}.${StorageRootId}` = `${remoteId}.${storageRootId}`;

      let store = userStores[key];
      if (store !== undefined) {
        return makeFailure(new ConflictError(trace, { errorCode: 'conflict' }));
      }

      const cryptoService = makeCryptoServiceWithPublicKeys({ publicKeys: creatorPublicCryptoKeysSet });

      const storeBacking = new InMemorySyncableStoreBacking({ provenance });

      const newStore = new DefaultSyncableStore({ storageRootId, backing: storeBacking, provenance, cryptoService });
      store = newStore;

      userStores[key] = newStore;

      DEV: debugTopic('SYNC', (log) => log(`REMOTE: Added folderAdded listener for ${newStore.path.toString()}`));
      removeListeners.push(
        newStore.addListener('folderAdded', ({ path }) => {
          DEV: debugTopic('SYNC', (log) => log(`REMOTE: Received folderAdded for ${path.toString()}`));
          onFolderAddedOrRemoved(trace, { store: newStore, remoteId, path });
        })
      );

      DEV: debugTopic('SYNC', (log) => log(`REMOTE: Added folderRemoved listener for ${newStore.path.toString()}`));
      removeListeners.push(
        newStore.addListener('folderRemoved', ({ path }) => {
          DEV: debugTopic('SYNC', (log) => log(`REMOTE: Received folderRemoved for ${path.toString()}`));
          onFolderAddedOrRemoved(trace, { store: newStore, remoteId, path });
        })
      );

      DEV: debugTopic('SYNC', (log) => log(`REMOTE: Added needsSync listener for ${newStore.path.toString()}`));
      removeListeners.push(
        newStore.addListener('needsSync', ({ path, hash }) => {
          DEV: debugTopic('SYNC', (log) => log(`REMOTE: Received needsSync for ${path.toString()}: ${hash}`));
          onNeedsSync(trace, { store: newStore, remoteId, path });
        })
      );

      return makeSuccess(store);
    }
  );

  const puller: SyncPuller = makeAsyncResultFunc(
    [import.meta.filename, 'puller'],
    async (localTrace, { remoteId, path, hash, sendData = false }): PR<SyncPullResponse, 'not-found'> => {
      const trace = makeSubTrace(localTrace, ['REMOTE']);

      const store = await disableLam(trace, 'not-found', (trace) => getMockRemoteStore(trace, remoteId, path.storageRootId));
      if (!store.ok) {
        return store;
      }

      const remoteItemAccessor = await getSyncableAtPath(trace, store.value, path);
      if (!remoteItemAccessor.ok) {
        return generalizeFailureResult(trace, remoteItemAccessor, ['deleted', 'untrusted', 'wrong-type']);
      }

      switch (remoteItemAccessor.value.type) {
        case 'folder':
          return await pullFolder(trace, { store: store.value, path, hash });

        case 'file':
          return await pullFile(trace, { store: store.value, path, hash, sendData });

        case 'bundle':
          return await pullBundle(trace, { store: store.value, path, hash });
      }
    }
  );

  const pusher: SyncPusher = makeAsyncResultFunc(
    [import.meta.filename, 'pusher'],
    async (localTrace, { remoteId, type, path, data, provenance }): PR<undefined> => {
      const trace = makeSubTrace(localTrace, ['REMOTE']);

      let store: Result<DefaultSyncableStore, 'conflict' | 'not-found'> = await disableLam(trace, 'not-found', (trace) =>
        getMockRemoteStore(trace, remoteId, path.storageRootId)
      );
      if (!store.ok) {
        // Creating the storage on the first push of root if it doesn't exist
        if (store.value.errorCode === 'not-found' && path.ids.length === 0) {
          store = await createMockRemoteStore(trace, remoteId, path.storageRootId, provenance);
          if (!store.ok) {
            return generalizeFailureResult(trace, store, ['conflict', 'not-found']);
          }
        } else {
          return generalizeFailureResult(trace, store, ['conflict', 'not-found']);
        }
      }

      switch (type) {
        case 'folder': {
          if (path.ids.length === 0) {
            // Nothing to do for root
            return makeSuccess(undefined);
          }

          const folder = await createViaSyncFolderAtPath(trace, store.value, path, provenance);
          if (!folder.ok) {
            if (folder.value.errorCode === 'deleted') {
              // Was locally (with respect to the mock remote) deleted, so not interested in this content
              return makeSuccess(undefined);
            }
            return generalizeFailureResult(
              trace,
              excludeFailureResult(folder, 'deleted'),
              ['conflict', 'not-found', 'untrusted', 'wrong-type'],
              `Failed to push folder: ${path.toString()}`
            );
          }

          return makeSuccess(undefined);
        }
        case 'bundle': {
          const bundle = await createViaSyncBundleAtPath(trace, store.value, path, provenance);
          if (!bundle.ok) {
            if (bundle.value.errorCode === 'deleted') {
              // Was locally (with respect to the mock remote) deleted, so not interested in this content
              return makeSuccess(undefined);
            }
            return generalizeFailureResult(
              trace,
              excludeFailureResult(bundle, 'deleted'),
              ['conflict', 'not-found', 'untrusted', 'wrong-type'],
              `Failed to push bundle file: ${path.toString()}`
            );
          }

          return makeSuccess(undefined);
        }
        case 'file': {
          const file = await createViaSyncPreEncodedBinaryFileAtPath(trace, store.value, path, data, provenance);
          if (!file.ok) {
            if (file.value.errorCode === 'deleted') {
              // Was locally (with respect to the mock remote) deleted, so not interested in this content
              return makeSuccess(undefined);
            }
            return generalizeFailureResult(
              trace,
              excludeFailureResult(file, 'deleted'),
              ['conflict', 'not-found', 'untrusted', 'wrong-type'],
              `Failed to push flat file: ${path.toString()}`
            );
          }

          return makeSuccess(undefined);
        }
      }
    }
  );

  return makeSuccess({
    puller,
    pusher,
    deviceNotificationClients,
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

// Helpers

const pullBundle = makeAsyncResultFunc(
  [import.meta.filename, 'pullBundle'],
  async (
    trace: Trace,
    { store, hash, path }: { store: SyncableStore; path: StaticSyncablePath; hash: Sha256Hash | undefined }
  ): PR<InSyncBundle | OutOfSyncBundle, 'not-found'> => {
    const bundle = await getSyncableAtPath(trace, store, path, 'bundle');
    if (!bundle.ok) {
      if (bundle.value.errorCode === 'deleted') {
        // Treating deleted as not found
        return makeFailure(new NotFoundError(trace, { cause: bundle.value, errorCode: 'not-found' }));
      }
      return generalizeFailureResult(trace, excludeFailureResult(bundle, 'deleted'), ['untrusted', 'wrong-type']);
    }

    const remoteHash = await bundle.value.getHash(trace);
    if (!remoteHash.ok) {
      return remoteHash;
    }

    if (remoteHash.value === hash) {
      return makeSuccess({ type: 'bundle', outOfSync: false } satisfies InSyncBundle);
    }

    const remoteProvenance = await bundle.value.getProvenance(trace);
    if (!remoteProvenance.ok) {
      return remoteProvenance;
    }

    const hashesById = await bundle.value.getHashesById(trace);
    if (!hashesById.ok) {
      return hashesById;
    }

    return makeSuccess({
      type: 'bundle',
      outOfSync: true,
      hashesById: hashesById.value,
      provenance: remoteProvenance.value
    } satisfies OutOfSyncBundle);
  }
);

const pullFolder = makeAsyncResultFunc(
  [import.meta.filename, 'pullFolder'],
  async (
    trace: Trace,
    { store, hash, path }: { store: SyncableStore; path: StaticSyncablePath; hash: Sha256Hash | undefined }
  ): PR<InSyncFolder | OutOfSyncFolder, 'not-found'> => {
    const folder = await getSyncableAtPath(trace, store, path, 'folder');
    if (!folder.ok) {
      if (folder.value.errorCode === 'deleted') {
        // Treating deleted as not found
        return makeFailure(new NotFoundError(trace, { cause: folder.value, errorCode: 'not-found' }));
      }
      return generalizeFailureResult(trace, excludeFailureResult(folder, 'deleted'), ['untrusted', 'wrong-type']);
    }

    const remoteHash = await folder.value.getHash(trace);
    if (!remoteHash.ok) {
      return remoteHash;
    }

    if (remoteHash.value === hash) {
      return makeSuccess({ type: 'folder', outOfSync: false } satisfies InSyncFolder);
    }

    const remoteProvenance = await folder.value.getProvenance(trace);
    if (!remoteProvenance.ok) {
      return remoteProvenance;
    }

    const hashesById = await folder.value.getHashesById(trace);
    if (!hashesById.ok) {
      return hashesById;
    }

    return makeSuccess({
      type: 'folder',
      outOfSync: true,
      hashesById: hashesById.value,
      provenance: remoteProvenance.value
    } satisfies OutOfSyncFolder);
  }
);

const pullFile = makeAsyncResultFunc(
  [import.meta.filename, 'pullFile'],
  async (
    trace: Trace,
    { store, hash, path, sendData }: { store: SyncableStore; path: StaticSyncablePath; hash: Sha256Hash | undefined; sendData: boolean }
  ): PR<InSyncFile | OutOfSyncFile, 'not-found'> => {
    const file = await getSyncableAtPath(trace, store, path, 'file');
    if (!file.ok) {
      if (file.value.errorCode === 'deleted') {
        // Treating deleted as not found
        return makeFailure(new NotFoundError(trace, { cause: file.value, errorCode: 'not-found' }));
      }
      return generalizeFailureResult(trace, excludeFailureResult(file, 'deleted'), ['untrusted', 'wrong-type']);
    }

    const remoteHash = await file.value.getHash(trace);
    if (!remoteHash.ok) {
      return remoteHash;
    }

    if (remoteHash.value === hash) {
      return makeSuccess({ type: 'file', outOfSync: false } satisfies InSyncFile);
    }

    // TODO: changing provenance (by accepting or rejecting) should probably trigger a hash change or something

    const remoteProvenance = await file.value.getProvenance(trace);
    if (!remoteProvenance.ok) {
      return remoteProvenance;
    }

    if (!sendData) {
      return makeSuccess({ type: 'file', outOfSync: true, provenance: remoteProvenance.value } satisfies OutOfSyncFile);
    } else {
      const data = await file.value.getEncodedBinary(trace);
      if (!data.ok) {
        return data;
      }

      return makeSuccess({
        type: 'file',
        outOfSync: true,
        data: data.value,
        provenance: remoteProvenance.value
      } satisfies OutOfSyncFile);
    }
  }
);
